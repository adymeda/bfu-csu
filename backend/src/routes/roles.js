const express = require("express")
const db = require("../db")
const { requireAuth } = require("../middleware/auth")
const { requireRank } = require("../middleware/requireRank")
const { RANKS } = require("../utils/ranks")

const router = express.Router()

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const { rows } = await db.query("SELECT id, name, rank FROM roles ORDER BY rank")
    res.json({ roles: rows })
  } catch (err) {
    next(err)
  }
})

router.post("/", requireRank(RANKS.ADMIN), async (req, res, next) => {
  try {
    const { name, rank } = req.body
    if (!name || !name.trim()) return res.status(400).json({ message: "Название роли обязательно" })
    if (typeof rank !== "number") return res.status(400).json({ message: "Ранг обязателен" })
    if (rank >= req.user.role.rank) {
      return res.status(403).json({ message: "Нельзя создать роль с рангом не ниже вашего" })
    }

    const { rows } = await db.query(
      "INSERT INTO roles (name, rank) VALUES ($1, $2) RETURNING id, name, rank",
      [name.trim(), rank]
    )
    res.status(201).json({ role: rows[0] })
  } catch (err) {
    next(err)
  }
})

router.patch("/:id", requireRank(RANKS.ADMIN), async (req, res, next) => {
  try {
    const { name, rank } = req.body
    if (rank !== undefined && rank >= req.user.role.rank) {
      return res.status(403).json({ message: "Нельзя установить ранг не ниже вашего" })
    }

    const updates = []
    const params = []
    if (name !== undefined) { params.push(name.trim()); updates.push(`name = $${params.length}`) }
    if (rank !== undefined) { params.push(rank); updates.push(`rank = $${params.length}`) }
    if (updates.length === 0) return res.status(400).json({ message: "Нет данных для обновления" })

    updates.push(`updated_at = now()`)
    params.push(req.params.id)

    const { rows } = await db.query(
      `UPDATE roles SET ${updates.join(", ")} WHERE id = $${params.length} RETURNING id, name, rank`,
      params
    )
    if (rows.length === 0) return res.status(404).json({ message: "Роль не найдена" })
    res.json({ role: rows[0] })
  } catch (err) {
    next(err)
  }
})

router.delete("/:id", requireRank(RANKS.ADMIN), async (req, res, next) => {
  try {
    const usersRes = await db.query("SELECT 1 FROM users WHERE role_id = $1 LIMIT 1", [req.params.id])
    if (usersRes.rows.length > 0) {
      return res.status(409).json({ message: "Нельзя удалить роль, к которой привязаны пользователи" })
    }
    const { rowCount } = await db.query("DELETE FROM roles WHERE id = $1", [req.params.id])
    if (rowCount === 0) return res.status(404).json({ message: "Роль не найдена" })
    res.status(204).end()
  } catch (err) {
    next(err)
  }
})

module.exports = router