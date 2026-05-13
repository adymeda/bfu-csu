const express = require("express")
const bcrypt = require("bcryptjs")
const db = require("../db")
const { requireAuth } = require("../middleware/auth")
const { generateSessionToken } = require("../utils/tokens")
const { pickAccentColor } = require("../utils/accentColor")

const router = express.Router()

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function sessionTTL() {
  const days = parseInt(process.env.SESSION_TTL_DAYS || "30", 10)
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000)
}

function formatUser(row) {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    accentColor: row.accent_color,
    avatarUrl: row.avatar_url ?? null,
    role: { id: row.role_id, name: row.role_name, rank: row.role_rank },
    createdAt: row.created_at,
  }
}

router.post("/register", async (req, res, next) => {
  try {
    const { email, password, displayName } = req.body

    if (!email || !EMAIL_RE.test(email)) {
      return res.status(400).json({ message: "Некорректный email" })
    }
    if (!password || password.length < 8) {
      return res.status(400).json({ message: "Пароль должен содержать не менее 8 символов" })
    }
    if (!displayName || !displayName.trim()) {
      return res.status(400).json({ message: "Отображаемое имя обязательно" })
    }

    const normalizedEmail = email.toLowerCase().trim()

    const roleRes = await db.query("SELECT id FROM roles WHERE name = $1", ["student"])
    if (roleRes.rows.length === 0) {
      return res.status(500).json({ message: "Роль по умолчанию не найдена" })
    }
    const roleId = roleRes.rows[0].id

    const passwordHash = await bcrypt.hash(password, 10)
    const accentColor = pickAccentColor()

    const userRes = await db.query(
      `INSERT INTO users (email, password_hash, display_name, accent_color, role_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, display_name, accent_color, avatar_url, role_id, created_at`,
      [normalizedEmail, passwordHash, displayName.trim(), accentColor, roleId]
    )
    const user = userRes.rows[0]

    const token = generateSessionToken()
    const expiresAt = sessionTTL()
    await db.query(
      "INSERT INTO sessions (token, user_id, expires_at) VALUES ($1, $2, $3)",
      [token, user.id, expiresAt]
    )

    const fullUser = {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      accentColor: user.accent_color,
      avatarUrl: user.avatar_url ?? null,
      role: { id: roleRes.rows[0].id, name: "student", rank: 100 },
      createdAt: user.created_at,
    }

    res.status(201).json({ user: fullUser, token })
  } catch (err) {
    next(err)
  }
})

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: "Email и пароль обязательны" })
    }

    const { rows } = await db.query(
      `SELECT u.id, u.email, u.password_hash, u.display_name, u.accent_color, u.avatar_url, u.created_at,
              r.id AS role_id, r.name AS role_name, r.rank AS role_rank
       FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE u.email = $1`,
      [email.toLowerCase().trim()]
    )

    if (rows.length === 0) {
      return res.status(401).json({ message: "Неверный email или пароль" })
    }

    const row = rows[0]
    const valid = await bcrypt.compare(password, row.password_hash)
    if (!valid) {
      return res.status(401).json({ message: "Неверный email или пароль" })
    }

    const token = generateSessionToken()
    const expiresAt = sessionTTL()
    await db.query(
      "INSERT INTO sessions (token, user_id, expires_at) VALUES ($1, $2, $3)",
      [token, row.id, expiresAt]
    )

    res.json({ user: formatUser(row), token })
  } catch (err) {
    next(err)
  }
})

router.post("/logout", requireAuth, async (req, res, next) => {
  try {
    await db.query("DELETE FROM sessions WHERE token = $1", [req.sessionToken])
    res.status(204).end()
  } catch (err) {
    next(err)
  }
})

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user })
})

module.exports = router