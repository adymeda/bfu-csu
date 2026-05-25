import { Request, Response } from "express"
import mlService from "../services/ml.service"

class HealthController {
    async get(_req: Request, res: Response) {
        const ml = await mlService.checkHealth()
        res.json({ status: "ok", services: { ml: ml ? "ok" : "unavailable" } })
    }
}

export default new HealthController()