import { Router } from "express"
import controller from "../controllers/event.controller"
import { checkAuth } from "../middleware/checkAuth"

const router = Router()

router.get("/", checkAuth, controller.list)
router.post("/", checkAuth, controller.create)

router.get("/:id", checkAuth, controller.getById)
router.patch("/:id", checkAuth, controller.update)
router.delete("/:id", checkAuth, controller.remove)

export default router