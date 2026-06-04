import { Request, Response, NextFunction } from "express"
import llmService from "../services/llm.service"

class CalendarController {
	async ask(req: Request, res: Response, next: NextFunction) {
		const { question } = req.body as { question: unknown }

		if(typeof question !== "string" || question.trim().length === 0)
			return res.status(400).json({ error: "question should be a non-empty string" })

		try {
			const result = await llmService.askCalendar(res.locals.userId as number, question.trim())
			res.json(result)
		} catch(err) {
			console.error("[llm] calendar/ask error:", (err as Error).message)
			res.status(502).json({ error: "LLM service unavailable" })
		}
	}
}

export default new CalendarController()
