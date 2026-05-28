import { Router } from "express"
import controller from "../controllers/link.controller"
import { checkAuth } from "../middleware/checkAuth"

const router = Router()

router.get('/', checkAuth, controller.getAll)
router.post('/', checkAuth, controller.create)
router.post('/telegram', checkAuth, controller.linkTelegram)
router.delete('/', checkAuth, controller.delete)

export default router