import express from "express";
import db from "../db.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

// GET /api/posts - all posts newest first
router.get("/", async (req, res) => {
  try {
    const [posts] = await db.query(`
      SELECT p.*, u.first_name, u.last_name, u.profile_photo,
        (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count,
        (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) AS like_count
      FROM posts p
      JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
    `);

    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: "Chyba serveru" });
  }
});

// GET /api/posts/:id - single post with comments and likes
router.get("/:id", async (req, res) => {
  try {
    const [posts] = await db.query(`
      SELECT p.*, u.first_name, u.last_name, u.profile_photo,
        (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) AS like_count
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `, [req.params.id]);

    if (posts.length === 0) {
      return res.status(404).json({ error: "Prispevek nenalezen" });
    }

    const [comments] = await db.query(`
      SELECT c.*, u.first_name, u.last_name, u.profile_photo
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.created_at DESC
    `, [req.params.id]);

    const [likes] = await db.query(`
      SELECT l.created_at, u.first_name, u.last_name
      FROM likes l
      JOIN users u ON l.user_id = u.id
      WHERE l.post_id = ?
    `, [req.params.id]);

    res.json({ ...posts[0], comments, likes });
  } catch (err) {
    res.status(500).json({ error: "Chyba serveru" });
  }
});

// POST /api/posts - create post
router.post("/", authMiddleware, async (req, res) => {
  const { title, text, image } = req.body;

  if (!title || !text) {
    return res.status(400).json({ error: "Nazev a text jsou povinne" });
  }

  try {
    const [result] = await db.query(
      "INSERT INTO posts (user_id, title, text, image) VALUES (?, ?, ?, ?)",
      [req.user.id, title, text, image || null]
    );

    res.status(201).json({ message: "Prispevek vytvoren", id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: "Chyba serveru" });
  }
});

// DELETE /api/posts/:id - delete own post
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const [posts] = await db.query("SELECT * FROM posts WHERE id = ?", [req.params.id]);

    if (posts.length === 0) {
      return res.status(404).json({ error: "Prispevek nenalezen" });
    }

    if (posts[0].user_id !== req.user.id) {
      return res.status(403).json({ error: "Nemuzete smazat cizi prispevek" });
    }

    await db.query("DELETE FROM posts WHERE id = ?", [req.params.id]);
    res.json({ message: "Prispevek smazan" });
  } catch (err) {
    res.status(500).json({ error: "Chyba serveru" });
  }
});

export default router;
