import express from "express";
import db from "../db.js";
import authMiddleware from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.get("/", async (_req, res) => {
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
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const [posts] = await db.query(`
      SELECT p.*, u.first_name, u.last_name, u.profile_photo,
        (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) AS like_count
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `, [req.params.id]);

    if (posts.length === 0) return res.status(404).json({ error: "Post not found" });

    const [comments] = await db.query(`
      SELECT c.*, u.first_name, u.last_name, u.profile_photo
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.created_at DESC
    `, [req.params.id]);

    const [likes] = await db.query(`
      SELECT l.user_id, l.created_at, u.first_name, u.last_name
      FROM likes l
      JOIN users u ON l.user_id = u.id
      WHERE l.post_id = ?
    `, [req.params.id]);

    res.json({ ...posts[0], comments, likes });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/", authMiddleware, upload.single("image"), async (req, res) => {
  const { title, text } = req.body;

  if (!title || !text) {
    return res.status(400).json({ error: "Title and text are required" });
  }

  try {
    const image = req.file ? "/uploads/" + req.file.filename : null;
    const [result] = await db.query(
      "INSERT INTO posts (user_id, title, text, image) VALUES (?, ?, ?, ?)",
      [req.user.id, title, text, image]
    );
    res.status(201).json({ message: "Post created", id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const [posts] = await db.query("SELECT * FROM posts WHERE id = ?", [req.params.id]);

    if (posts.length === 0) return res.status(404).json({ error: "Post not found" });
    if (posts[0].user_id !== req.user.id) return res.status(403).json({ error: "Cannot delete someone else's post" });

    await db.query("DELETE FROM posts WHERE id = ?", [req.params.id]);
    res.json({ message: "Post deleted" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
