import { Request, Response, NextFunction } from "express"
import service from "../services/link.service"
import telegram from "../services/telegram.service"
import type { CreateLinkDto } from "../types/link"

class LinksController {
    async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const links = await service.getAll(res.locals.userId as number)
            res.json(links)
        } catch(err) {
            next(err)
        }
    }

    async create(req: Request, res: Response, next: NextFunction) {
        const { link_type, link_value } = req.body as CreateLinkDto

        if(typeof link_type !== 'number' || !Number.isInteger(link_type))
            return res.status(400).json({
                error: "link_type should be an integer"
            })

        if(typeof link_value !== 'string' || link_value.length === 0)
            return res.status(400).json({
                error: "link_value should be a non-empty string"
            })

        try {
            const link = await service.create(res.locals.userId as number, { link_type, link_value })
            res.status(201).json(link)
        } catch (err: unknown) {
            const pg = err as { code?: string }
            if(pg.code === '23505') res.status(409).json({
                error: "Link already exists"
            })
            else next(err)
        }
    }

    async linkTelegram(req: Request, res: Response, next: NextFunction) {
        const { code } = req.body as { code: unknown }

        if(typeof code !== 'string' || code.length === 0)
            return res.status(400).json({
                error: "code should be a non-empty string"
            })

        try {
            const result = await telegram.link(res.locals.userId as number, code)
            if(result.ok) return res.json({ telegram_id: result.telegram_id })
            if(result.reason === "not_found") return res.status(404).json({ error: "Invalid or unknown code" })
            if(result.reason === "expired") return res.status(410).json({ error: "Code expired" })
            return res.status(503).json({ error: "Telegram service unavailable" })
        } catch(err) {
            next(err)
        }
    }

    async delete(req: Request, res: Response, next: NextFunction) {
        const { link_type } = req.body as { link_type: unknown }

        if(typeof link_type !== 'number' || !Number.isInteger(link_type))
            return res.status(400).json({
                error: "link_type should be an integer"
            })

        try {
            const deleted = await service.delete(res.locals.userId as number, link_type)
            if(!deleted) return res.status(404).json({
                error: "Link not found"
            })

            res.status(204).send()
        } catch(err) {
            next(err)
        }
    }
}

export default new LinksController()