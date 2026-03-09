const express = require("express")

const healthRouter = require("./health")
const authRouter = require("./auth")

const router = express.Router()

router.use("/api/health", healthRouter)
router.use("/api/auth", authRouter)

module.exports = router
