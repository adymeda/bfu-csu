import { Router } from "express"
const router = Router()

import usersRouter from "./users"
import authRouter from "./auth"
import linksRouter from "./links"
import groupsRouter from "./groups"
import messagesRouter from "./messages"
import eventsRouter from "./events"
import deadlinesRouter from "./deadlines"
import calendarRouter from "./calendar"
import attachmentsRouter from "./attachments"
import healthRouter from "./health"
import llmRouter from "./llm"

router.use("/users/link", linksRouter)
router.use("/users", usersRouter)
router.use("/auth", authRouter)
router.use("/groups", groupsRouter)
router.use("/messages", messagesRouter)
router.use("/events", eventsRouter)
router.use("/deadlines", deadlinesRouter)
router.use("/calendar", calendarRouter)
router.use("/attachments", attachmentsRouter)
router.use("/health", healthRouter)
router.use("/llm", llmRouter)

export default router