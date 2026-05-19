import { Request, Response, NextFunction } from "express"
import service from "../services/message.service"
import groupService from "../services/group.service"
import type { RecipientInput, CreateMessageDto } from "../types/message"
import { RECIPIENT_TYPE } from "../types/message"
import type { CreateEventDto } from "../types/event"
import type { CreateDeadlineDto } from "../types/deadline"
import { parseId } from "../utils/parseId"
import { isValidDate } from "../utils/isValidDate"
import { AttachmentLinkError } from "../repositories/attachment.repo"

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

        const rawEvents = body["events"]
        const rawDeadlines = body["deadlines"]

        const validatedEvents: CreateEventDto[] = []
        const validatedDeadlines: CreateDeadlineDto[] = []

        if(rawEvents !== undefined) {
            if(!Array.isArray(rawEvents)) return res.status(400).json({
                error: "events must be an array"
            })
            for (const e of rawEvents) {
                if(typeof e !== "object" || e === null) return res.status(400).json({
                    error: "each event must be an object"
                })
                const ev = e as Record<string, unknown>
                if(typeof ev["title"] !== "string" || (ev["title"] as string).length === 0 || (ev["title"] as string).length > 255)
                    return res.status(400).json({ error: "event title must be a non-empty string up to 255 characters" })
                if(!Number.isInteger(ev["assignee_id"]) || (ev["assignee_id"] as number) < 1)
                    return res.status(400).json({ error: "event assignee_id must be a positive integer" })
                if(!isValidDate(ev["start_at"]))
                    return res.status(400).json({ error: "event start_at must be a valid ISO date string" })
                if(ev["end_at"] !== undefined && ev["end_at"] !== null) {
                    if(!isValidDate(ev["end_at"]))
                        return res.status(400).json({ error: "event end_at must be a valid ISO date string or null" })
                    if(new Date(ev["end_at"] as string) < new Date(ev["start_at"] as string))
                        return res.status(400).json({ error: "event end_at must be >= start_at" })
                }
                validatedEvents.push({
                    title: ev["title"] as string,
                    assignee_id: ev["assignee_id"] as number,
                    start_at: ev["start_at"] as string,
                    end_at: ev["end_at"] !== undefined ? (ev["end_at"] as string | null) : null,
                })
            }
        }

        if(rawDeadlines !== undefined) {
            if(!Array.isArray(rawDeadlines)) return res.status(400).json({
                error: "deadlines must be an array"
            })
            for (const d of rawDeadlines) {
                if(typeof d !== "object" || d === null) return res.status(400).json({
                    error: "each deadline must be an object"
                })
                const dl = d as Record<string, unknown>
                if(typeof dl["title"] !== "string" || (dl["title"] as string).length === 0 || (dl["title"] as string).length > 255)
                    return res.status(400).json({ error: "deadline title must be a non-empty string up to 255 characters" })
                if(!Number.isInteger(dl["assignee_id"]) || (dl["assignee_id"] as number) < 1)
                    return res.status(400).json({ error: "deadline assignee_id must be a positive integer" })
                if(!isValidDate(dl["due_at"]))
                    return res.status(400).json({ error: "deadline due_at must be a valid ISO date string" })
                validatedDeadlines.push({
                    title: dl["title"] as string,
                    assignee_id: dl["assignee_id"] as number,
                    due_at: dl["due_at"] as string,
                })
            }
        }

        const rawAttachments = body["attachments"]
        let validatedAttachments: number[] = []
        if(rawAttachments !== undefined) {
            if(!Array.isArray(rawAttachments)) return res.status(400).json({
                error: "attachments must be an array"
            })
            if(rawAttachments.length > 5) return res.status(400).json({
                error: "attachments must contain at most 5 items"
            })
            for(const a of rawAttachments) {
                if(!Number.isInteger(a) || (a as number) < 1) return res.status(400).json({
                    error: "each attachment must be a positive integer id"
                })
            }
            validatedAttachments = rawAttachments as number[]
        }

        try {
            for (const e of validatedEvents) {
                if(e.assignee_id !== userId) {
                    const ok = await groupService.canAssign(userId, e.assignee_id)
                    if(!ok) return res.status(403).json({
                        error: "Event assignee is not in your group or a subgroup"
                    })
                }
            }
            for (const d of validatedDeadlines) {
                if(d.assignee_id !== userId) {
                    const ok = await groupService.canAssign(userId, d.assignee_id)
                    if(!ok) return res.status(403).json({
                        error: "Deadline assignee is not in your group or a subgroup"
                    })
                }
            }

            if(reply_to != null) {
                const ok = await service.hasAccess(reply_to as number, userId)
                if(!ok) return res.status(404).json({
                    error: "reply_to message not found"
                })
            }

            const dto: CreateMessageDto = {
                title,
                content,
                reply_to: reply_to != null ? (reply_to as number) : null,
                recipients,
                events: validatedEvents,
                deadlines: validatedDeadlines,
                attachments: validatedAttachments,
            }
            const msg = await service.create(dto, userId)
            res.status(201).json(msg)
        } catch (err: unknown) {
            if(err instanceof AttachmentLinkError) return res.status(400).json({
                error: "Invalid attachment id"
            })
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