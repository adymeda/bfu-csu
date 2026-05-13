const express = require("express")

const healthRouter = require("./health")
const authRouter = require("./auth")
const usersRouter = require("./users")
const rolesRouter = require("./roles")
const groupsRouter = require("./groups")
const socialLinksRouter = require("./socialLinks")

const router = express.Router()

router.use("/api/health", healthRouter)
router.use("/api/auth", authRouter)
router.use("/api/users", usersRouter)
router.use("/api/users", socialLinksRouter)
router.use("/api/roles", rolesRouter)
router.use("/api/groups", groupsRouter)

module.exports = router