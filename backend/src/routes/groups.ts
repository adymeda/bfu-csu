import { Router } from "express"
import controller from "../controllers/group.controller"
import { checkAuth } from "../middleware/checkAuth"

const router = Router()

router.get('/search', checkAuth, controller.search)
router.get('/suggested', checkAuth, controller.getSuggested)
router.get('/roots', checkAuth, controller.getRoots)

router.post('/', checkAuth, controller.create)

router.get('/:id', checkAuth, controller.getById)
router.patch('/:id', checkAuth, controller.update)
router.delete('/:id', checkAuth, controller.remove)

router.get('/:id/children', checkAuth, controller.getChildren)
router.get('/:id/ancestors', checkAuth, controller.getAncestors)

router.get('/:id/members', checkAuth, controller.getMembers)
router.post('/:id/members', checkAuth, controller.addMember)
router.delete('/:id/members/:userId', checkAuth, controller.removeMember)

router.get('/:id/admins', checkAuth, controller.getAdmins)
router.post('/:id/admins', checkAuth, controller.addAdmin)
router.delete('/:id/admins/:userId', checkAuth, controller.removeAdmin)

router.post('/:id/aliases', checkAuth, controller.addAlias)
router.delete('/:id/aliases/:alias', checkAuth, controller.removeAlias)

router.put('/:id/roles/:userId', checkAuth, controller.setRole)

export default router