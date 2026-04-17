import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "../db.js";
import upload from "../middleware/upload.js";

const router = express.Router();

const JWT_SECRET = "tajny_klic_123";

router.post("/register", upload.single("profile_photo"), async (req, res) => {
  const { first_name, last_name, age, gender, username, email, password } = req.body;

  if (!first_name || !last_name || !age || !gender || !username || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  if (Number(age) < 13) {
    return res.status(400).json({ error: "Age must be at least 13" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const profile_photo = req.file ? "/uploads/" + req.file.filename : null;

    await db.query(
      "INSERT INTO users (first_name, last_name, age, gender, username, email, password, profile_photo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [first_name, last_name, Number(age), gender, username, email, hashedPassword, profile_photo]
    );

    res.status(201).json({ message: "Registration successful" });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "Username or email already taken" });
    }
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Enter username/email and password" });
  }

  try {
    const [rows] = await db.query(
      "SELECT * FROM users WHERE username = ? OR email = ?",
      [username, username]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: "8h" });

    res.json({
      token,
      user: { id: user.id, username: user.username, first_name: user.first_name, last_name: user.last_name }
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
