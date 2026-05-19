import { Router } from "express"
import controller from "../controllers/user.controller"
import { checkAuth } from "../middleware/checkAuth"

const router = Router()

router.post('/', controller.register)
router.get('/:id', checkAuth, controller.getById)
router.patch('/:id', checkAuth, controller.update)
router.delete('/:id', checkAuth, controller.delete)

export default router