import { Router } from "express"
const router = Router()

import usersRouter from "./users"

router.get("/", (_, res) => res.send({ status: "ok" }))
router.use("/users", usersRouter)

export default router