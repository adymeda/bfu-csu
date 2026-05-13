const express = require("express")
const db = require("../db")
const { requireAuth } = require("../middleware/auth")

const router = express.Router()

router.get("/:id/social", requireAuth, async (req, res, next) => {
  try {
    const userRes = await db.query("SELECT 1 FROM users WHERE id = $1", [req.params.id])
    if (userRes.rows.length === 0) return res.status(404).json({ message: "Пользователь не найден" })

    const { rows } = await db.query(
      "SELECT id, platform, value, created_at, updated_at FROM social_links WHERE user_id = $1 ORDER BY platform",
      [req.params.id]
    )
    res.json({ socialLinks: rows })
  } catch (err) {
    next(err)
  }
})

router.put("/me/social/:platform", requireAuth, async (req, res, next) => {
  try {
    const { value } = req.body
    if (!value || !value.trim()) return res.status(400).json({ message: "Значение обязательно" })

    const platform = req.params.platform.toLowerCase().trim()
    if (platform.length > 32) return res.status(400).json({ message: "Название платформы слишком длинное" })

    const { rows } = await db.query(
      `INSERT INTO social_links (user_id, platform, value)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, platform) DO UPDATE
         SET value = EXCLUDED.value, updated_at = now()
       RETURNING id, platform, value, created_at, updated_at`,
      [req.user.id, platform, value.trim()]
    )
    res.json({ socialLink: rows[0] })
  } catch (err) {
    next(err)
  }
})

router.delete("/me/social/:platform", requireAuth, async (req, res, next) => {
  try {
    const platform = req.params.platform.toLowerCase().trim()
    const { rowCount } = await db.query(
      "DELETE FROM social_links WHERE user_id = $1 AND platform = $2",
      [req.user.id, platform]
    )
    if (rowCount === 0) return res.status(404).json({ message: "Привязка не найдена" })
    res.status(204).end()
  } catch (err) {
    next(err)
  }
})

module.exports = router