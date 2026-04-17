import express from "express";
import db from "../db.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

router.post("/", authMiddleware, async (req, res) => {
  const { post_id } = req.body;
  if (!post_id) return res.status(400).json({ error: "post_id is required" });

  try {
    const [posts] = await db.query("SELECT * FROM posts WHERE id = ?", [post_id]);
    if (posts.length === 0) return res.status(404).json({ error: "Post not found" });

    await db.query("INSERT INTO likes (user_id, post_id) VALUES (?, ?)", [req.user.id, post_id]);
    res.status(201).json({ message: "Like added" });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") return res.status(400).json({ error: "Already liked this post" });
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:post_id", authMiddleware, async (req, res) => {
  try {
    const [result] = await db.query(
      "DELETE FROM likes WHERE user_id = ? AND post_id = ?",
      [req.user.id, req.params.post_id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: "Like not found" });
    res.json({ message: "Like removed" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
