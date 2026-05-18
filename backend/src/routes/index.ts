import { Router } from "express"
const router = Router()

import usersRouter from "./users"
import authRouter from "./auth"
import linksRouter from "./links"
import groupsRouter from "./groups"
import messagesRouter from "./messages"

router.use("/users/link", linksRouter)
router.use("/users", usersRouter)
router.use("/auth", authRouter)
router.use("/groups", groupsRouter)
router.use("/messages", messagesRouter)

export default router