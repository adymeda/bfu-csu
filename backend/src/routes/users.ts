import { Router } from "express"
import controller from "../controllers/user.controller"

const router = Router()

router.post('/', controller.register)
router.get('/:id', controller.getById)
router.patch('/:id', controller.update)
router.delete('/:id', controller.delete)

export default router