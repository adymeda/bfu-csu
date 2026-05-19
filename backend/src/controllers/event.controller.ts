import { Request, Response, NextFunction } from "express"
import service from "../services/event.service"
import groupService from "../services/group.service"
import { parseId } from "../utils/parseId"
import { isValidDate } from "../utils/isValidDate"

class EventsController {
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
            const events = await service.findByUser(res.locals.userId as number, from, to)
            res.json(events)
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
            const event = await service.findById(id)
            if(!event) return res.status(404).json({
                error: "Event not found"
            })
            res.json(event)
        } catch (err) {
            next(err)
        }
    }

    async create(req: Request, res: Response, next: NextFunction) {
        const body = req.body as Record<string, unknown>
        const { title, assignee_id, start_at, end_at, message_id } = body
        const userId = res.locals.userId as number

        if(typeof title !== "string" || title.length === 0 || title.length > 255)
            return res.status(400).json({
                error: "title must be a non-empty string up to 255 characters"
            })

        if(!Number.isInteger(assignee_id) || (assignee_id as number) < 1)
            return res.status(400).json({
                error: "assignee_id must be a positive integer"
            })

        if(!isValidDate(start_at))
            return res.status(400).json({
                error: "start_at must be a valid ISO date string"
            })

        if(end_at !== undefined && end_at !== null) {
            if(!isValidDate(end_at))
                return res.status(400).json({
                    error: "end_at must be a valid ISO date string or null"
                })
            if(new Date(end_at) < new Date(start_at))
                return res.status(400).json({
                    error: "end_at must be >= start_at"
                })
        }

        if(message_id !== undefined && message_id !== null) {
            if(!Number.isInteger(message_id) || (message_id as number) < 1)
                return res.status(400).json({
                    error: "message_id must be a positive integer or null"
                })
        }

        try {
            if((assignee_id as number) !== userId) {
                const ok = await groupService.canAssign(userId, assignee_id as number)
                if(!ok) return res.status(403).json({
                    error: "Assignee is not in your group or a subgroup"
                })
            }

            const event = await service.create(
                {
                    title,
                    assignee_id: assignee_id as number,
                    start_at: start_at as string,
                    end_at: end_at !== undefined ? (end_at as string | null) : null,
                    message_id: message_id !== undefined ? (message_id as number | null) : null,
                },
                userId
            )
            res.status(201).json(event)
        } catch (err: unknown) {
            const pg = err as { code?: string }
            if(pg.code === "23503") return res.status(400).json({
                error: "Invalid message_id or assignee_id"
            })
            if(pg.code === "23514") return res.status(400).json({
                error: "end_at must be >= start_at"
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
        const { title, assignee_id, start_at, end_at, message_id } = body
        const userId = res.locals.userId as number

        if("title" in body) {
            if(typeof title !== "string" || title.length === 0 || title.length > 255)
                return res.status(400).json({
                    error: "title must be a non-empty string up to 255 characters"
                })
        }

        if("assignee_id" in body) {
            if(!Number.isInteger(assignee_id) || (assignee_id as number) < 1)
                return res.status(400).json({
                    error: "assignee_id must be a positive integer"
                })
        }

        if("start_at" in body) {
            if(!isValidDate(start_at))
                return res.status(400).json({
                    error: "start_at must be a valid ISO date string"
                })
        }

        if("end_at" in body && end_at !== null) {
            if(!isValidDate(end_at))
                return res.status(400).json({
                    error: "end_at must be a valid ISO date string or null"
                })
        }

        if("message_id" in body && message_id !== null) {
            if(!Number.isInteger(message_id) || (message_id as number) < 1)
                return res.status(400).json({
                    error: "message_id must be a positive integer or null"
                })
        }

        try {
            const event = await service.findById(id)
            if(!event) return res.status(404).json({
                error: "Event not found"
            })
            if(event.created_by.id !== userId) return res.status(403).json({
                error: "Forbidden"
            })

            if("assignee_id" in body && (assignee_id as number) !== userId) {
                const ok = await groupService.canAssign(userId, assignee_id as number)
                if(!ok) return res.status(403).json({
                    error: "Assignee is not in your group or a subgroup"
                })
            }

            const updated = await service.update(id, body)
            if(updated === null) return res.status(400).json({
                error: "No valid fields to update"
            })
            res.json(updated)
        } catch (err: unknown) {
            const pg = err as { code?: string }
            if(pg.code === "23503") return res.status(400).json({
                error: "Invalid message_id or assignee_id"
            })
            if(pg.code === "23514") return res.status(400).json({
                error: "end_at must be >= start_at"
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
            const event = await service.findById(id)
            if(!event) return res.status(404).json({
                error: "Event not found"
            })
            if(event.created_by.id !== userId) return res.status(403).json({
                error: "Forbidden"
            })

            await service.delete(id)
            res.status(204).send()
        } catch (err) {
            next(err)
        }
    }
}

export default new EventsController()