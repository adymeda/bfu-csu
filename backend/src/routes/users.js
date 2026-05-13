const express = require("express")
const db = require("../db")
const { requireAuth } = require("../middleware/auth")
const { requireRank } = require("../middleware/requireRank")
const { RANKS } = require("../utils/ranks")

const router = express.Router()

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200)
    const offset = parseInt(req.query.offset) || 0
    const q = req.query.q ? `%${req.query.q}%` : null

    const params = [limit, offset]
    let whereCondition = ""
    if (q) {
      params.push(q, q)
      whereCondition = `WHERE u.display_name ILIKE $${params.length - 1} OR u.email ILIKE $${params.length}`
    }

    const { rows } = await db.query(
      `SELECT u.id, u.email, u.display_name, u.accent_color, u.avatar_url,
              r.id AS role_id, r.name AS role_name, r.rank AS role_rank
       FROM users u
       JOIN roles r ON r.id = u.role_id
       ${whereCondition}
       ORDER BY u.display_name
       LIMIT $1 OFFSET $2`,
      params
    )

    res.json({ users: rows.map(formatUser) })
  } catch (err) {
    next(err)
  }
})

router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT u.id, u.email, u.display_name, u.accent_color, u.avatar_url, u.created_at,
              r.id AS role_id, r.name AS role_name, r.rank AS role_rank
       FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE u.id = $1`,
      [req.params.id]
    )
    if (rows.length === 0) return res.status(404).json({ message: "Пользователь не найден" })
    res.json({ user: formatUser(rows[0]) })
  } catch (err) {
    next(err)
  }
})

router.patch("/:id", requireAuth, async (req, res, next) => {
  try {
    const targetId = parseInt(req.params.id)
    const isSelf = req.user.id === targetId
    const isAdmin = req.user.role.rank >= RANKS.ADMIN
    const { displayName, avatarUrl, accentColor, roleId } = req.body

    if (!isSelf && !isAdmin) {
      return res.status(403).json({ message: "Недостаточно прав" })
    }

    if (roleId !== undefined) {
      const roleRes = await db.query("SELECT rank FROM roles WHERE id = $1", [roleId])
      if (roleRes.rows.length === 0) return res.status(404).json({ message: "Роль не найдена" })
      const newRank = roleRes.rows[0].rank

      const targetRes = await db.query(
        "SELECT r.rank FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = $1",
        [targetId]
      )
      if (targetRes.rows.length === 0) return res.status(404).json({ message: "Пользователь не найден" })
      const targetCurrentRank = targetRes.rows[0].rank

      if (req.user.role.rank <= targetCurrentRank || newRank >= req.user.role.rank) {
        return res.status(403).json({ message: "Нельзя изменить роль пользователя с таким же или более высоким рангом" })
      }
    }

    const updates = []
    const params = []
    if (displayName !== undefined) { params.push(displayName.trim()); updates.push(`display_name = $${params.length}`) }
    if (avatarUrl !== undefined) { params.push(avatarUrl || null); updates.push(`avatar_url = $${params.length}`) }
    if (accentColor !== undefined) { params.push(accentColor); updates.push(`accent_color = $${params.length}`) }
    if (roleId !== undefined) { params.push(roleId); updates.push(`role_id = $${params.length}`) }

    if (updates.length === 0) return res.status(400).json({ message: "Нет данных для обновления" })

    updates.push(`updated_at = now()`)
    params.push(targetId)

    const { rows } = await db.query(
      `UPDATE users SET ${updates.join(", ")} WHERE id = $${params.length}
       RETURNING id, email, display_name, accent_color, avatar_url, role_id, created_at, updated_at`,
      params
    )
    if (rows.length === 0) return res.status(404).json({ message: "Пользователь не найден" })

    const roleRes = await db.query("SELECT id, name, rank FROM roles WHERE id = $1", [rows[0].role_id])
    const r = roleRes.rows[0]
    res.json({
      user: {
        ...formatUser({ ...rows[0], role_id: r.id, role_name: r.name, role_rank: r.rank }),
        updatedAt: rows[0].updated_at,
      },
    })
  } catch (err) {
    next(err)
  }
})

router.delete("/:id", requireRank(RANKS.ADMIN), async (req, res, next) => {
  try {
    const { rowCount } = await db.query("DELETE FROM users WHERE id = $1", [req.params.id])
    if (rowCount === 0) return res.status(404).json({ message: "Пользователь не найден" })
    res.status(204).end()
  } catch (err) {
    next(err)
  }
})

function formatUser(row) {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    accentColor: row.accent_color,
    avatarUrl: row.avatar_url ?? null,
    role: { id: row.role_id, name: row.role_name, rank: row.role_rank },
    ...(row.created_at ? { createdAt: row.created_at } : {}),
  }
}

module.exports = router