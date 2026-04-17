import express from "express";
import db from "../db.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

router.post("/", authMiddleware, async (req, res) => {
  const { post_id, text } = req.body;

  if (!post_id || !text) {
    return res.status(400).json({ error: "post_id and text are required" });
  }

  try {
    const [posts] = await db.query("SELECT * FROM posts WHERE id = ?", [post_id]);
    if (posts.length === 0) return res.status(404).json({ error: "Post not found" });

    const [result] = await db.query(
      "INSERT INTO comments (user_id, post_id, text) VALUES (?, ?, ?)",
      [req.user.id, post_id, text]
    );
    res.status(201).json({ message: "Comment added", id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const [comments] = await db.query("SELECT * FROM comments WHERE id = ?", [req.params.id]);
    if (comments.length === 0) return res.status(404).json({ error: "Comment not found" });
    if (comments[0].user_id !== req.user.id) return res.status(403).json({ error: "Cannot delete someone else's comment" });

    await db.query("DELETE FROM comments WHERE id = ?", [req.params.id]);
    res.json({ message: "Comment deleted" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
