import { Request, Response } from "express"
import service from "../services/link.service"
import type { CreateLinkDto } from "../types/link"

class LinksController {
    async getAll(req: Request, res: Response) {
        try {
            const links = await service.getAll(res.locals.userId as number)
            res.json(links)
        } catch {
            res.status(500).json({
                error: "Internal Server Error"
            })
        }
    }

    async create(req: Request, res: Response) {
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
            else res.status(500).json({
                error: "Internal Server Error" 
            })
        }
    }

    async delete(req: Request, res: Response) {
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
        } catch {
            res.status(500).json({
                error: "Internal Server Error"
            })
        }
    }
}

export default new LinksController()