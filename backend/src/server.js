require("dotenv").config({ quiet: true })

const express = require("express")

const app = express()

const PORT = process.env.PORT || 3909

app.listen(PORT, () => {
    console.log(`Server started at http://localhost:${PORT}/`)
})