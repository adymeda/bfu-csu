function errorHandler(err, req, res, next) {
	console.error(err)

	if (err.code === "23505") {
		return res.status(409).json({ message: "Запись уже существует" })
	}
	if (err.code === "23503") {
		return res.status(409).json({ message: "Нарушение связи: зависимая запись не найдена" })
	}
	if (err.status) {
		return res.status(err.status).json({ message: err.message })
	}

	res.status(500).json({ message: "Внутренняя ошибка сервера" })
}

module.exports = { errorHandler }