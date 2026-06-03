import { Router } from "express"
import controller from "../controllers/llm.controller"
import { checkAuth } from "../middleware/checkAuth"

const router = Router()

router.post("/compose-message", checkAuth, controller.compose)
router.post("/extract-event", checkAuth, controller.extractEvent)
router.post("/summarize-inbox", checkAuth, controller.summarizeInbox)

export default router