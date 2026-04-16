import express from "express";
import db from "../db.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
  try {
    const [users] = await db.query(
      "SELECT id, first_name, last_name, age, gender, profile_photo, created_at FROM users ORDER BY last_name ASC"
    );

    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Chyba serveru" });
  }
});

// GET /api/users/:id - user detail with their posts and activity
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const [users] = await db.query(
      "SELECT id, first_name, last_name, age, gender, profile_photo, created_at FROM users WHERE id = ?",
      [req.params.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: "Uzivatel nenalezen" });
    }

    // own posts
    const [ownPosts] = await db.query(`
      SELECT p.*, u.first_name, u.last_name, u.profile_photo,
        (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count,
        (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) AS like_count
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.user_id = ?
      ORDER BY p.created_at DESC
    `, [req.params.id]);

    // posts this user liked or commented (not their own)
    const [activity] = await db.query(`
      SELECT DISTINCT p.*, u.first_name, u.last_name, u.profile_photo,
        (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count,
        (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) AS like_count
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.user_id != ?
        AND (
          EXISTS (SELECT 1 FROM likes l WHERE l.post_id = p.id AND l.user_id = ?)
          OR
          EXISTS (SELECT 1 FROM comments c WHERE c.post_id = p.id AND c.user_id = ?)
        )
      ORDER BY p.created_at DESC
    `, [req.params.id, req.params.id, req.params.id]);

    res.json({ user: users[0], own_posts: ownPosts, activity });
  } catch (err) {
    res.status(500).json({ error: "Chyba serveru" });
  }
});

export default router;
