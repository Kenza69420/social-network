import express from "express";
import db from "../db.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

// POST /api/likes - like a post
router.post("/", authMiddleware, async (req, res) => {
  const { post_id } = req.body;

  if (!post_id) {
    return res.status(400).json({ error: "post_id je povinne" });
  }

  try {
    const [posts] = await db.query("SELECT * FROM posts WHERE id = ?", [post_id]);

    if (posts.length === 0) {
      return res.status(404).json({ error: "Prispevek nenalezen" });
    }

    await db.query(
      "INSERT INTO likes (user_id, post_id) VALUES (?, ?)",
      [req.user.id, post_id]
    );

    res.status(201).json({ message: "Like pridan" });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "Tento prispevek jiz mate olajkovany" });
    }
    res.status(500).json({ error: "Chyba serveru" });
  }
});

// DELETE /api/likes/:post_id - unlike a post
router.delete("/:post_id", authMiddleware, async (req, res) => {
  try {
    const [result] = await db.query(
      "DELETE FROM likes WHERE user_id = ? AND post_id = ?",
      [req.user.id, req.params.post_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Like nenalezen" });
    }

    res.json({ message: "Like odebran" });
  } catch (err) {
    res.status(500).json({ error: "Chyba serveru" });
  }
});

export default router;
