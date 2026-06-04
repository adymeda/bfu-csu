import { Request, Response, NextFunction } from "express"
import service from "../services/llm.service"

class LlmController {
    async compose(req: Request, res: Response, next: NextFunction) {
        const { description } = req.body as { description: unknown }

        if(typeof description !== "string" || description.trim().length === 0)
            return res.status(400).json({ error: "description should be a non-empty string" })

        try {
            const result = await service.compose(res.locals.userId as number, description.trim())
            res.json(result)
        } catch(err) {
            console.error("[llm] compose-message error:", (err as Error).message)
            res.status(502).json({ error: "LLM service unavailable" })
        }
    }

    async extractEvent(req: Request, res: Response, next: NextFunction) {
        const { text } = req.body as { text: unknown }

        if(typeof text !== "string" || text.trim().length === 0)
            return res.status(400).json({ error: "text should be a non-empty string" })

        try {
            const result = await service.extractEvent(text.trim())
            res.json(result)
        } catch(err) {
            console.error("[llm] extract-event error:", (err as Error).message)
            res.status(502).json({ error: "LLM service unavailable" })
        }
    }

    async extractDeadline(req: Request, res: Response, next: NextFunction) {
        const { text } = req.body as { text: unknown }

        if(typeof text !== "string" || text.trim().length === 0)
            return res.status(400).json({ error: "text should be a non-empty string" })

        try {
            const result = await service.extractDeadline(text.trim())
            res.json(result)
        } catch(err) {
            console.error("[llm] extract-deadline error:", (err as Error).message)
            res.status(502).json({ error: "LLM service unavailable" })
        }
    }

    async summarizeInbox(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await service.summarize(res.locals.userId as number)
            res.json(result)
        } catch(err) {
            console.error("[llm] summarize-inbox error:", (err as Error).message)
            res.status(502).json({ error: "LLM service unavailable" })
        }
    }
}

export default new LlmController()