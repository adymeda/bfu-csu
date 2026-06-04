import { Router } from "express"
import controller from "../controllers/calendar.controller"
import { checkAuth } from "../middleware/checkAuth"

const router = Router()

router.post("/ask", checkAuth, controller.ask)

export default router
