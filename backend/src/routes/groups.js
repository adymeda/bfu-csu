const express = require("express")
const db = require("../db")
const { requireAuth } = require("../middleware/auth")
const { requireRank } = require("../middleware/requireRank")
const { RANKS } = require("../utils/ranks")

const router = express.Router()

async function assertVisible(groupId, userRank, res) {
  const { rows } = await db.query("SELECT min_view_rank FROM groups WHERE id = $1", [groupId])
  if (rows.length === 0) { res.status(404).json({ message: "Группа не найдена" }); return false }
  if (rows[0].min_view_rank > userRank) { res.status(403).json({ message: "Недостаточно прав для просмотра группы" }); return false }
  return true
}

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT id, name, description, min_view_rank, created_at
       FROM groups
       WHERE min_view_rank <= $1
       ORDER BY name`,
      [req.user.role.rank]
    )
    res.json({ groups: rows })
  } catch (err) {
    next(err)
  }
})

router.post("/", requireRank(RANKS.ADMIN), async (req, res, next) => {
  try {
    const { name, description, minViewRank = 0 } = req.body
    if (!name || !name.trim()) return res.status(400).json({ message: "Название группы обязательно" })

    const { rows } = await db.query(
      `INSERT INTO groups (name, description, min_view_rank)
       VALUES ($1, $2, $3)
       RETURNING id, name, description, min_view_rank, created_at`,
      [name.trim(), description || null, minViewRank]
    )
    res.status(201).json({ group: rows[0] })
  } catch (err) {
    next(err)
  }
})

router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const ok = await assertVisible(req.params.id, req.user.role.rank, res)
    if (!ok) return

    const { rows } = await db.query(
      "SELECT id, name, description, min_view_rank, created_at, updated_at FROM groups WHERE id = $1",
      [req.params.id]
    )
    res.json({ group: rows[0] })
  } catch (err) {
    next(err)
  }
})

router.patch("/:id", requireRank(RANKS.ADMIN), async (req, res, next) => {
  try {
    const { name, description, minViewRank } = req.body
    const updates = []
    const params = []
    if (name !== undefined) { params.push(name.trim()); updates.push(`name = $${params.length}`) }
    if (description !== undefined) { params.push(description || null); updates.push(`description = $${params.length}`) }
    if (minViewRank !== undefined) { params.push(minViewRank); updates.push(`min_view_rank = $${params.length}`) }
    if (updates.length === 0) return res.status(400).json({ message: "Нет данных для обновления" })

    updates.push(`updated_at = now()`)
    params.push(req.params.id)

    const { rows } = await db.query(
      `UPDATE groups SET ${updates.join(", ")} WHERE id = $${params.length}
       RETURNING id, name, description, min_view_rank, created_at, updated_at`,
      params
    )
    if (rows.length === 0) return res.status(404).json({ message: "Группа не найдена" })
    res.json({ group: rows[0] })
  } catch (err) {
    next(err)
  }
})

router.delete("/:id", requireRank(RANKS.ADMIN), async (req, res, next) => {
  try {
    const { rowCount } = await db.query("DELETE FROM groups WHERE id = $1", [req.params.id])
    if (rowCount === 0) return res.status(404).json({ message: "Группа не найдена" })
    res.status(204).end()
  } catch (err) {
    next(err)
  }
})

router.get("/:id/members", requireAuth, async (req, res, next) => {
  try {
    const ok = await assertVisible(req.params.id, req.user.role.rank, res)
    if (!ok) return

    const { rows } = await db.query(
      `SELECT u.id, u.email, u.display_name, u.accent_color, u.avatar_url,
              r.id AS role_id, r.name AS role_name, r.rank AS role_rank,
              gm.added_at
       FROM group_members gm
       JOIN users u ON u.id = gm.user_id
       JOIN roles r ON r.id = u.role_id
       WHERE gm.group_id = $1
       ORDER BY u.display_name`,
      [req.params.id]
    )
    res.json({
      members: rows.map((row) => ({
        id: row.id,
        email: row.email,
        displayName: row.display_name,
        accentColor: row.accent_color,
        avatarUrl: row.avatar_url ?? null,
        role: { id: row.role_id, name: row.role_name, rank: row.role_rank },
        addedAt: row.added_at,
      })),
    })
  } catch (err) {
    next(err)
  }
})

router.post("/:id/members", requireRank(RANKS.ADMIN), async (req, res, next) => {
  try {
    const { userId } = req.body
    if (!userId) return res.status(400).json({ message: "userId обязателен" })

    const userRes = await db.query("SELECT 1 FROM users WHERE id = $1", [userId])
    if (userRes.rows.length === 0) return res.status(404).json({ message: "Пользователь не найден" })

    const groupRes = await db.query("SELECT 1 FROM groups WHERE id = $1", [req.params.id])
    if (groupRes.rows.length === 0) return res.status(404).json({ message: "Группа не найдена" })

    await db.query(
      "INSERT INTO group_members (group_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [req.params.id, userId]
    )
    res.status(201).json({ message: "Пользователь добавлен в группу" })
  } catch (err) {
    next(err)
  }
})

router.delete("/:id/members/:userId", requireRank(RANKS.ADMIN), async (req, res, next) => {
  try {
    const { rowCount } = await db.query(
      "DELETE FROM group_members WHERE group_id = $1 AND user_id = $2",
      [req.params.id, req.params.userId]
    )
    if (rowCount === 0) return res.status(404).json({ message: "Участник не найден в группе" })
    res.status(204).end()
  } catch (err) {
    next(err)
  }
})

module.exports = router