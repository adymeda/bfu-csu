require("dotenv").config({ quiet: true })

const express = require("express")

const router = require("./routes")

const app = express()
app.use(express.json())
app.use(router)

const PORT = process.env.PORT || 3909

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}/`)
})