import { Router } from "express"
import controller from "../controllers/health.controller"

const router = Router()

router.get("/", controller.get.bind(controller))

export default router