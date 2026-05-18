import { Router } from "express"
const router = Router()

import usersRouter from "./users"
import authRouter from "./auth"
import linksRouter from "./links"

router.use("/users/link", linksRouter)
router.use("/users", usersRouter)
router.use("/auth", authRouter)

export default router