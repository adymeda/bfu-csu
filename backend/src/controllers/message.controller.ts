import { Request, Response, NextFunction } from "express"
import service from "../services/message.service"
import type { RecipientInput } from "../types/message"
import { RECIPIENT_TYPE } from "../types/message"
import { parseId } from "../utils/parseId"

function validateRecipients(recipients: unknown): recipients is RecipientInput[] {
    if(!Array.isArray(recipients) || recipients.length === 0) return false
    for (const r of recipients) {
        if(typeof r !== "object" || r === null) return false
        const rec = r as Record<string, unknown>
        if(!Number.isInteger(rec["type"])) return false
        if(!Number.isInteger(rec["id"])) return false
        if(rec["type"] !== RECIPIENT_TYPE.USER && rec["type"] !== RECIPIENT_TYPE.GROUP) return false
    }
    return true
}

class MessagesController {
    async create(req: Request, res: Response, next: NextFunction) {
        const body = req.body as Record<string, unknown>
        const { title, content, reply_to, recipients } = body

        if(typeof title !== "string" || title.length === 0)
            return res.status(400).json({
                error: "title should be a non-empty string"
            })

        if(typeof content !== "string" || content.length === 0)
            return res.status(400).json({
                error: "content should be a non-empty string"
            })

        if(reply_to !== undefined && reply_to !== null) {
            if(typeof reply_to !== "number" || !Number.isInteger(reply_to))
                return res.status(400).json({
                    error: "reply_to should be an integer"
                })
        }

        if(!validateRecipients(recipients))
            return res.status(400).json({
                error: "recipients must be a non-empty array of { type: 0/1, id: integer }"
            })

        const userId = res.locals.userId as number

        try {
            if(reply_to != null) {
                const ok = await service.hasAccess(reply_to as number, userId)
                if(!ok) return res.status(404).json({
                    error: "reply_to message not found"
                })
            }

            const msg = await service.create(
                {
                    title,
                    content,
                    reply_to: reply_to != null ? (reply_to as number) : null,
                    recipients,
                },
                userId
            )
            res.status(201).json(msg)
        } catch (err: unknown) {
            const pg = err as { code?: string }
            if(pg.code === "23503") return res.status(400).json({
                error: "Invalid recipient id"
            })
            
            next(err)
        }
    }

    async list(req: Request, res: Response, next: NextFunction) {
        const rawLimit = req.query["limit"]
        const limit = rawLimit !== undefined ? parseInt(rawLimit as string) : 20
        if(isNaN(limit) || limit < 1 || limit > 50)
            return res.status(400).json({
                error: "limit must be an integer between 1 and 50"
            })

        const rawBefore = req.query["before"]
        let before: number | null = null
        if(rawBefore !== undefined) {
            before = parseInt(rawBefore as string)
            if(isNaN(before)) return res.status(400).json({
                error: "before must be an integer"
            })
        }

        const favorite = req.query["favorite"] === "1"
        const unread = req.query["unread"] === "1"

        try {
            const messages = await service.findList(res.locals.userId as number, { limit, before, favorite, unread })
            res.json(messages)
        } catch (err) {
            next(err)
        }
    }

    async getById(req: Request, res: Response, next: NextFunction) {
        const id = parseId(req.params["id"])
        if(id === null) return res.status(400).json({
            error: "id should be an integer"
        })

        try {
            const msg = await service.findDetail(id, res.locals.userId as number)
            if(!msg) return res.status(404).json({
                error: "Message not found"
            })
            res.json(msg)
        } catch (err) {
            next(err)
        }
    }

    async markRead(req: Request, res: Response, next: NextFunction) {
        const id = parseId(req.params["id"])
        if(id === null) return res.status(400).json({
            error: "id should be an integer"
        })

        try {
            const ok = await service.setState(id, res.locals.userId as number, { field: "is_read", value: true })
            if(!ok) return res.status(404).json({
                error: "Message not found"
            })

            res.status(204).send()
        } catch (err) {
            next(err)
        }
    }

    async unmarkRead(req: Request, res: Response, next: NextFunction) {
        const id = parseId(req.params["id"])
        if(id === null) return res.status(400).json({
            error: "id should be an integer"
        })
        try {
            const ok = await service.setState(id, res.locals.userId as number, { field: "is_read", value: false })
            if(!ok) return res.status(404).json({
                error: "Message not found"
            })

            res.status(204).send()
        } catch (err) {
            next(err)
        }
    }

    async markFavorite(req: Request, res: Response, next: NextFunction) {
        const id = parseId(req.params["id"])
        if(id === null) return res.status(400).json({
            error: "id should be an integer"
        })

        try {
            const ok = await service.setState(id, res.locals.userId as number, { field: "is_favorite", value: true })
            if(!ok) return res.status(404).json({
                error: "Message not found"
            })

            res.status(204).send()
        } catch (err) {
            next(err)
        }
    }

    async unmarkFavorite(req: Request, res: Response, next: NextFunction) {
        const id = parseId(req.params["id"])
        if(id === null) return res.status(400).json({
            error: "id should be an integer"
        })

        try {
            const ok = await service.setState(id, res.locals.userId as number, { field: "is_favorite", value: false })
            if(!ok) return res.status(404).json({
                error: "Message not found"
            })

            res.status(204).send()
        } catch (err) {
            next(err)
        }
    }

    async deleteMessage(req: Request, res: Response, next: NextFunction) {
        const id = parseId(req.params["id"])
        if(id === null) return res.status(400).json({
            error: "id should be an integer"
        })

        try {
            const ok = await service.setState(id, res.locals.userId as number, { field: "is_deleted", value: true })
            if(!ok) return res.status(404).json({
                error: "Message not found"
            })

            res.status(204).send()
        } catch (err) { next(err) }
    }

    async forward(req: Request, res: Response, next: NextFunction) {
        const id = parseId(req.params["id"])
        if(id === null) return res.status(400).json({
            error: "id should be an integer"
        })

        const { recipients } = req.body as { recipients: unknown }

        if(!validateRecipients(recipients))
            return res.status(400).json({
                error: "recipients must be a non-empty array of { type: 0|1, id: integer }"
            })

        const userId = res.locals.userId as number

        try {
            const hasAccess = await service.hasAccess(id, userId)
            if(!hasAccess) return res.status(404).json({
                error: "Message not found"
            })

            const msg = await service.forward(id, userId, recipients)
            if(!msg) return res.status(404).json({
                error: "Message not found"
            })

            res.status(201).json(msg)
        } catch (err: unknown) {
            const pg = err as { code?: string }
            if(pg.code === "23503") return res.status(400).json({
                error: "Invalid recipient id"
            })

            next(err)
        }
    }
}

export default new MessagesController()