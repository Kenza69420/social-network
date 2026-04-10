import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "../db.js";

const router = express.Router();

const JWT_SECRET = "tajny_klic_123";

// POST /api/auth/register
router.post("/register", async (req, res) => {
  const { first_name, last_name, age, gender, username, password, profile_photo } = req.body;

  if (!first_name || !last_name || !age || !gender || !username || !password) {
    return res.status(400).json({ error: "Vyplnte vsechna povinná pole" });
  }

  if (age < 13) {
    return res.status(400).json({ error: "Vek musi byt alespon 13 let" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      "INSERT INTO users (first_name, last_name, age, gender, username, password, profile_photo) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [first_name, last_name, age, gender, username, hashedPassword, profile_photo || null]
    );

    res.status(201).json({ message: "Registrace uspesna" });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "Username je jiz pouzite" });
    }
    res.status(500).json({ error: "Chyba serveru" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Vyplnte username a heslo" });
  }

  try {
    const [rows] = await db.query("SELECT * FROM users WHERE username = ?", [username]);

    if (rows.length === 0) {
      return res.status(401).json({ error: "Spatne prihlasovaci udaje" });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({ error: "Spatne prihlasovaci udaje" });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: "8h" });

    res.json({ token, user: { id: user.id, username: user.username, first_name: user.first_name, last_name: user.last_name } });
  } catch (err) {
    res.status(500).json({ error: "Chyba serveru" });
  }
});

export default router;
