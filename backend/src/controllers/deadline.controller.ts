import { Request, Response, NextFunction } from "express"
import service from "../services/deadline.service"
import groupService from "../services/group.service"
import { parseId } from "../utils/parseId"
import { isValidDate } from "../utils/isValidDate"
import { validateRecipients } from "../utils/validateRecipients"
import { RECIPIENT_TYPE } from "../types/message"

class DeadlinesController {
    async list(req: Request, res: Response, next: NextFunction) {
        const rawFrom = req.query["from"]
        const rawTo = req.query["to"]

        let from: string | null = null
        let to: string | null = null

        if(rawFrom !== undefined) {
            if(!isValidDate(rawFrom)) return res.status(400).json({
                error: "from must be a valid ISO date string"
            })
            from = rawFrom as string
        }
        if(rawTo !== undefined) {
            if(!isValidDate(rawTo)) return res.status(400).json({
                error: "to must be a valid ISO date string"
            })
            to = rawTo as string
        }

        try {
            const deadlines = await service.findByUser(res.locals.userId as number, from, to)
            res.json(deadlines)
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
            const deadline = await service.findById(id)
            if(!deadline) return res.status(404).json({
                error: "Deadline not found"
            })
            res.json(deadline)
        } catch (err) {
            next(err)
        }
    }

    async create(req: Request, res: Response, next: NextFunction) {
        const body = req.body as Record<string, unknown>
        const { title, recipients, due_at, message_id } = body
        const userId = res.locals.userId as number

        if(typeof title !== "string" || title.length === 0 || title.length > 255)
            return res.status(400).json({
                error: "title must be a non-empty string up to 255 characters"
            })

        if(!validateRecipients(recipients))
            return res.status(400).json({
                error: "recipients must be a non-empty array of { type: 0|1, id: integer }"
            })

        if(!isValidDate(due_at))
            return res.status(400).json({
                error: "due_at must be a valid ISO date string"
            })

        if(message_id !== undefined && message_id !== null) {
            if(!Number.isInteger(message_id) || (message_id as number) < 1)
                return res.status(400).json({
                    error: "message_id must be a positive integer or null"
                })
        }

        try {
            for (const r of recipients) {
                if(r.type === RECIPIENT_TYPE.USER && r.id !== userId) {
                    const ok = await groupService.canAssign(userId, r.id)
                    if(!ok) return res.status(403).json({
                        error: "Recipient is not in your group or a subgroup"
                    })
                }
            }

            const deadline = await service.create(
                {
                    title,
                    recipients,
                    due_at: due_at as string,
                    message_id: message_id !== undefined ? (message_id as number | null) : null,
                },
                userId
            )
            res.status(201).json(deadline)
        } catch (err: unknown) {
            const pg = err as { code?: string }
            if(pg.code === "23503") return res.status(400).json({
                error: "Invalid message_id or recipient id"
            })
            next(err)
        }
    }

    async update(req: Request, res: Response, next: NextFunction) {
        const id = parseId(req.params["id"])
        if(id === null) return res.status(400).json({
            error: "id should be an integer"
        })

        const body = req.body as Record<string, unknown>
        const { title, recipients, due_at, message_id } = body
        const userId = res.locals.userId as number

        if("title" in body) {
            if(typeof title !== "string" || title.length === 0 || title.length > 255)
                return res.status(400).json({
                    error: "title must be a non-empty string up to 255 characters"
                })
        }

        if("recipients" in body) {
            if(!validateRecipients(recipients))
                return res.status(400).json({
                    error: "recipients must be a non-empty array of { type: 0|1, id: integer }"
                })
        }

        if("due_at" in body) {
            if(!isValidDate(due_at))
                return res.status(400).json({
                    error: "due_at must be a valid ISO date string"
                })
        }

        if("message_id" in body && message_id !== null) {
            if(!Number.isInteger(message_id) || (message_id as number) < 1)
                return res.status(400).json({
                    error: "message_id must be a positive integer or null"
                })
        }

        try {
            const deadline = await service.findById(id)
            if(!deadline) return res.status(404).json({
                error: "Deadline not found"
            })
            if(deadline.created_by.id !== userId) return res.status(403).json({
                error: "Forbidden"
            })

            if("recipients" in body && validateRecipients(recipients)) {
                for (const r of recipients) {
                    if(r.type === RECIPIENT_TYPE.USER && r.id !== userId) {
                        const ok = await groupService.canAssign(userId, r.id)
                        if(!ok) return res.status(403).json({
                            error: "Recipient is not in your group or a subgroup"
                        })
                    }
                }
            }

            const updated = await service.update(id, body)
            if(updated === null) return res.status(400).json({
                error: "No valid fields to update"
            })
            res.json(updated)
        } catch (err: unknown) {
            const pg = err as { code?: string }
            if(pg.code === "23503") return res.status(400).json({
                error: "Invalid message_id or recipient id"
            })
            next(err)
        }
    }

    async remove(req: Request, res: Response, next: NextFunction) {
        const id = parseId(req.params["id"])
        if(id === null) return res.status(400).json({
            error: "id should be an integer"
        })

        const userId = res.locals.userId as number

        try {
            const deadline = await service.findById(id)
            if(!deadline) return res.status(404).json({
                error: "Deadline not found"
            })
            if(deadline.created_by.id !== userId) return res.status(403).json({
                error: "Forbidden"
            })

            await service.delete(id)
            res.status(204).send()
        } catch (err) {
            next(err)
        }
    }
}

export default new DeadlinesController()