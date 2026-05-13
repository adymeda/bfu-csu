require("dotenv").config({ quiet: true })

const express = require("express")
const cors = require("cors")

const router = require("./routes")
const { errorHandler } = require("./middleware/error")

const app = express()

app.use(cors({
	origin: process.env.CORS_ORIGIN || "http://localhost:5173",
	credentials: true,
}))
app.use(express.json())
app.use(router)
app.use(errorHandler)

const PORT = process.env.PORT || 3909

app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}/`)
})