const db = require("../db")

async function requireAuth(req, res, next) {
	const header = req.headers["authorization"]
	if (!header || !header.startsWith("Bearer ")) return res.status(401).json({ message: "Требуется авторизация" })

	const token = header.slice(7)
	if (!token) return res.status(401).json({ message: "Требуется авторизация" })

	try {
		const { rows } = await db.query(
			`SELECT
				u.id, u.email, u.display_name, u.accent_color, u.avatar_url,
				r.id AS role_id, r.name AS role_name, r.rank AS role_rank,
				s.id AS session_id
			FROM sessions s
			JOIN users u ON u.id = s.user_id
			JOIN roles r ON r.id = u.role_id
			WHERE s.token = $1 AND s.expires_at > now()`,
			[token]
		)

		if (rows.length === 0) return res.status(401).json({ message: "Сессия недействительна или истекла" })
		const row = rows[0]

		await db.query("UPDATE sessions SET last_used_at = now() WHERE id = $1", [row.session_id])

		req.user = {
			id: row.id,
			email: row.email,
			displayName: row.display_name,
			accentColor: row.accent_color,
			avatarUrl: row.avatar_url,
			role: {
				id: row.role_id,
				name: row.role_name,
				rank: row.role_rank,
			}
		}
		req.sessionToken = token

		next()
	} catch (err) {
		next(err)
	}
}

module.exports = { requireAuth }