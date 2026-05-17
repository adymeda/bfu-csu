require("dotenv").config({ quiet: true })

const express = require("express")
const app = express()
app.use(express.json())

const router = require("./routes")
app.use("/api", router)

const PORT = process.env.PORT || 3909

app.listen(PORT, () => {
    console.log(`Server started at http://localhost:${PORT}/`)
})