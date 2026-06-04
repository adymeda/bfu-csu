import { Request, Response, NextFunction } from "express"
import service from "../services/message.service"
import mlService from "../services/ml.service"
import notificationsService from "../services/notifications.service"
import userRepo from "../repositories/user.repo"
import type { RecipientInput, CreateMessageDto } from "../types/message"
import { MESSAGE_CATEGORIES } from "../types/message"
import type { CreateEventDto } from "../types/event"
import type { CreateDeadlineDto } from "../types/deadline"
import { parseId } from "../utils/parseId"
import { isValidDate } from "../utils/isValidDate"
import { validateRecipients } from "../utils/validateRecipients"
import { AttachmentLinkError } from "../repositories/attachment.repo"

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
                    recipients: [],
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
                if(!isValidDate(dl["due_at"]))
                    return res.status(400).json({ error: "deadline due_at must be a valid ISO date string" })
                validatedDeadlines.push({
                    title: dl["title"] as string,
                    recipients: [],
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
            if(reply_to != null) {
                const ok = await service.hasAccess(reply_to as number, userId)
                if(!ok) return res.status(404).json({
                    error: "reply_to message not found"
                })
            }

            const moderation = await mlService.checkToxicity(`${title}\n${content}`)
            if(moderation?.toxic) return res.status(422).json({
                error: "Message rejected by toxicity filter",
                score: moderation.score,
            })

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

            const sender = await userRepo.findById(userId)
            if(sender) {
                void notificationsService.dispatchMessage({
                    sender: { id: userId, display_name: sender.display_name },
                    title,
                    content,
                    recipients,
                })
            }

            void service.categorize(msg.id, title, content)

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

        const rawBox = req.query["box"] ?? "inbox"
        if(rawBox !== "inbox" && rawBox !== "sent")
            return res.status(400).json({
                error: "box must be \"inbox\" or \"sent\""
            })
        const box = rawBox as "inbox" | "sent"

        const rawCategory = req.query["category"]
        let category: string | null = null
        if(rawCategory !== undefined) {
            if(typeof rawCategory !== "string" || !MESSAGE_CATEGORIES.has(rawCategory))
                return res.status(400).json({
                    error: "category must be one of: учебное, организационное, личное, объявление"
                })
            category = rawCategory
        }

        const favorite = req.query["favorite"] === "1"
        const unread = req.query["unread"] === "1"
        const requires_response = req.query["requires_response"] === "1"
        const has_events = req.query["has_events"] === "1"
        const has_deadlines = req.query["has_deadlines"] === "1"

        try {
            const messages = await service.findList(res.locals.userId as number, {
                box,
                limit,
                before,
                favorite,
                unread,
                category,
                requires_response,
                has_events,
                has_deadlines,
            })
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