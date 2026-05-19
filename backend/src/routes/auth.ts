import { Router } from "express"
import controller from "../controllers/auth.controller"
import { checkAuth } from "../middleware/checkAuth"

const router = Router()

router.get('/me', checkAuth, controller.me)
router.post('/register', controller.register)
router.post('/login', controller.login)
router.post('/logout', controller.logout)

export default router