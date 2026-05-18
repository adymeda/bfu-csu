import 'dotenv/config'

import express from "express"
const app = express()
app.use(express.json())

import router from "./routes"
app.use("/api", router)

import errorHandler from "./middleware/errorHandler"
app.use(errorHandler)

const PORT = process.env.PORT || 3909

app.listen(PORT, () => {
    console.log(`Server started at http://localhost:${PORT}/`)
})