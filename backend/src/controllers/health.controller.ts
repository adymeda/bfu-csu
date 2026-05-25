import { Request, Response } from "express"
import mlService from "../services/ml.service"
import telegramService from "../services/telegram.service"

class HealthController {
    async get(_req: Request, res: Response) {
        const [ml, telegram] = await Promise.all([
            mlService.checkHealth(),
            telegramService.checkHealth(),
        ])
        res.json({
            status: "ok",
            services: {
                ml: ml ? "ok" : "unavailable",
                telegram: telegram ? "ok" : "unavailable",
            },
        })
    }
}

export default new HealthController()