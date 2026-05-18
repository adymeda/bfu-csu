import { Router } from "express"
const router = Router()

import usersRouter from "./users"
import authRouter from "./auth"

router.use("/users", usersRouter)
router.use("/auth", authRouter)

export default router