import { Router } from "express"
const router = Router()

import controller from "../controllers/user.controller"

router.get("/", controller.getAllUsers)
router.post("/create", controller.createUser)

export default router