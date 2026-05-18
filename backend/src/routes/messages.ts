import { Router } from "express"
import controller from "../controllers/message.controller"
import { checkAuth } from "../middleware/checkAuth"

const router = Router()

router.post("/", checkAuth, controller.create)
router.get("/", checkAuth, controller.list)

router.get("/:id", checkAuth, controller.getById)
router.delete("/:id", checkAuth, controller.deleteMessage)

router.post("/:id/read", checkAuth, controller.markRead)
router.delete("/:id/read", checkAuth, controller.unmarkRead)

router.post("/:id/favorite", checkAuth, controller.markFavorite)
router.delete("/:id/favorite", checkAuth, controller.unmarkFavorite)

router.post("/:id/forward", checkAuth, controller.forward)

export default router