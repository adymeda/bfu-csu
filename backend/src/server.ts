import 'dotenv/config'

import express from "express"
const app = express()
app.use(express.json())

import router from "./routes"
app.use("/api", router)

import errorHandler from "./middleware/errorHandler"
app.use(errorHandler)

import { initAdmin } from "./init"
import { startServiceHealthMonitor } from "./utils/serviceHealthMonitor"

const PORT = process.env.PORT || 3909

app.listen(PORT, async () => {
    console.log(`Server started at http://localhost:${PORT}/`)
    await initAdmin()
    startServiceHealthMonitor()
})