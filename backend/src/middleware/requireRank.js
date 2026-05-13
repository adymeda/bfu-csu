const { requireAuth } = require("./auth")

function requireRank(minRank) {
	return [
		requireAuth,
		(req, res, next) => {
			if (req.user.role.rank < minRank) {
				return res.status(403).json({ message: "Недостаточно прав" })
			}
			next()
		},
	]
}

module.exports = { requireRank }