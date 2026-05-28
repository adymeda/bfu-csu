import { Request, Response, NextFunction } from "express"
import service from "../services/group.service"
import type { CreateGroupDto, AddAdminDto } from "../types/group"
import { parseId } from "../utils/parseId"

class GroupsController {
    async create(req: Request, res: Response, next: NextFunction) {
        const { name, parent_id } = req.body as CreateGroupDto

        if(typeof name !== "string" || name.length === 0)
            return res.status(400).json({
                error: "name should be a non-empty string"
            })

        if(parent_id !== undefined && parent_id !== null && !Number.isInteger(parent_id))
            return res.status(400).json({
                error: "parent_id should be an integer, null or undefined"
            })

        try {
            const group = await service.create({
                name,
                parent_id: parent_id ?? null
            })

            res.status(201).json(group)
        } catch(err) {
            next(err)
        }
    }

    async search(req: Request, res: Response, next: NextFunction) {
        const q = req.query["q"]

        if(typeof q !== "string" || q.length === 0)
            return res.status(400).json({
                error: "q should be a non-empty string"
            })

        try {
            const groups = await service.search(res.locals.userId as number, q)
            res.json(groups)
        } catch(err) {
            next(err)
        }
    }

    async getSuggested(req: Request, res: Response, next: NextFunction) {
        try {
            const groups = await service.suggested(res.locals.userId as number)
            res.json(groups)
        } catch(err) {
            next(err)
        }
    }

    async getRoots(req: Request, res: Response, next: NextFunction) {
        try {
            const groups = await service.roots(res.locals.userId as number)
            res.json(groups)
        } catch(err) {
            next(err)
        }
    }

    async getById(req: Request, res: Response, next: NextFunction) {
        const id = parseId(req.params["id"])
        if(id === null) return res.status(400).json({
            error: "id should be an integer"
        })

        try {
            const visible = await service.isVisible(res.locals.userId as number, id)
            if(!visible) return res.status(404).json({
                error: "Group not found"
            })

            const group = await service.findById(id)
            if(!group) return res.status(404).json({
                error: "Group not found"
            })

            res.json(group)
        } catch(err) {
            next(err)
        }
    }

    async update(req: Request, res: Response, next: NextFunction) {
        const id = parseId(req.params["id"])
        if(id === null) return res.status(400).json({
            error: "id should be an integer"
        })

        const body = req.body as Record<string, unknown>

        if("name" in body && (typeof body["name"] !== "string" || (body["name"] as string).length === 0))
            return res.status(400).json({
                error: "name should be a non-empty string"
            })

        if("parent_id" in body && body["parent_id"] !== null && !Number.isInteger(body["parent_id"]))
            return res.status(400).json({
                error: "parent_id should be an integer or null"
            })

        try {
            const visible = await service.isVisible(res.locals.userId as number, id)
            if(!visible) return res.status(404).json({
                error: "Group not found"
            })

            const isAdmin = await service.isAdmin(res.locals.userId as number, id)
            if(!isAdmin) return res.status(403).json({
                error: "Forbidden"
            })

            const group = await service.update(id, body)
            if(!group) return res.status(400).json({
                error: "No fields to update"
            })

            res.json(group)
        } catch(err) {
            next(err)
        }
    }

    async remove(req: Request, res: Response, next: NextFunction) {
        const id = parseId(req.params["id"])
        if(id === null) return res.status(400).json({
            error: "id should be an integer"
        })

        try {
            const visible = await service.isVisible(res.locals.userId as number, id)
            if(!visible) return res.status(404).json({
                error: "Group not found"
            })

            const isAdmin = await service.isAdmin(res.locals.userId as number, id)
            if(!isAdmin) return res.status(403).json({
                error: "Forbidden"
            })

            await service.delete(id)
            res.status(204).send()
        } catch(err) {
            next(err)
        }
    }

    async getChildren(req: Request, res: Response, next: NextFunction) {
        const id = parseId(req.params["id"])
        if(id === null) return res.status(400).json({
            error: "id should be an integer"
        })

        try {
            const visible = await service.isVisible(res.locals.userId as number, id)
            if(!visible) return res.status(404).json({
                error: "Group not found"
            })

            const children = await service.findChildren(id)
            res.json(children)
        } catch(err) {
            next(err)
        }
    }

    async getAncestors(req: Request, res: Response, next: NextFunction) {
        const id = parseId(req.params["id"])
        if(id === null) return res.status(400).json({
            error: "id should be an integer"
        })

        try {
            const visible = await service.isVisible(res.locals.userId as number, id)
            if(!visible) return res.status(404).json({
                error: "Group not found"
            })

            const ancestors = await service.findAncestors(id)
            res.json(ancestors)
        } catch(err) {
            next(err)
        }
    }

    async getMembers(req: Request, res: Response, next: NextFunction) {
        const id = parseId(req.params["id"])
        if(id === null) return res.status(400).json({
            error: "id should be an integer"
        })

        const deep = req.query["deep"] === "1"

        try {
            const visible = await service.isVisible(res.locals.userId as number, id)
            if(!visible) return res.status(404).json({
                error: "Group not found"
            })

            const members = await service.findMembers(id, deep)
            res.json(members)
        } catch(err) {
            next(err)
        }
    }

    async addMember(req: Request, res: Response, next: NextFunction) {
        const id = parseId(req.params["id"])
        if(id === null) return res.status(400).json({
            error: "id should be an integer"
        })

        const { user_id } = req.body as { user_id: unknown }
        if(!Number.isInteger(user_id))
            return res.status(400).json({
            error: "user_id should be an integer"
        })

        try {
            const visible = await service.isVisible(res.locals.userId as number, id)
            if(!visible) return res.status(404).json({
                error: "Group not found"
            })

            const isAdmin = await service.isAdmin(res.locals.userId as number, id)
            if(!isAdmin) return res.status(403).json({
                error: "Forbidden"
            })

            await service.addMember(id, user_id as number)
            res.status(201).json({
                group_id: id, user_id
            })
        } catch (err: unknown) {
            const pg = err as { code?: string }
            if(pg.code === "23505") res.status(409).json({
                error: "User is already a member of this group"
            })
            else next(err)
        }
    }

    async removeMember(req: Request, res: Response, next: NextFunction) {
        const id = parseId(req.params["id"])
        const userId = parseId(req.params["userId"])
        if(id === null || userId === null)
            return res.status(400).json({
                error: "id should be an integer"
            })

        try {
            const visible = await service.isVisible(res.locals.userId as number, id)
            if(!visible) return res.status(404).json({
                error: "Group not found"
            })

            const isAdmin = await service.isAdmin(res.locals.userId as number, id)
            if(!isAdmin) return res.status(403).json({
                error: "Forbidden"
            })

            const removed = await service.removeMember(id, userId)
            if(!removed) return res.status(404).json({
                error: "Group member not found"
            })

            res.status(204).send()
        } catch(err) {
            next(err)
        }
    }

    async getAdmins(req: Request, res: Response, next: NextFunction) {
        const id = parseId(req.params["id"])
        if(id === null) return res.status(400).json({
            error: "id should be an integer"
        })

        try {
            const visible = await service.isVisible(res.locals.userId as number, id)
            if(!visible) return res.status(404).json({
                error: "Group not found"
            })

            const admins = await service.findAdmins(id)
            res.json(admins)
        } catch(err) {
            next(err)
        }
    }

    async addAdmin(req: Request, res: Response, next: NextFunction) {
        const id = parseId(req.params["id"])
        if(id === null) return res.status(400).json({
            error: "id should be an integer"
        })

        const { user_id, is_super } = req.body as AddAdminDto

        if(!Number.isInteger(user_id))
            return res.status(400).json({
                error: "user_id should be an integer"
            })

        if(is_super !== undefined && typeof is_super !== "boolean")
            return res.status(400).json({
                error: "is_super should be a boolean"
            })

        try {
            const visible = await service.isVisible(res.locals.userId as number, id)
            if(!visible) return res.status(404).json({
                error: "Group not found"
            })

            const isSuperAdmin = await service.isSuperAdmin(res.locals.userId as number, id)
            if(!isSuperAdmin) return res.status(403).json({
                error: "Forbidden"
            })

            await service.addAdmin(id, user_id, is_super ?? false)
            res.status(201).json({
                group_id: id,
                user_id,
                is_super: is_super ?? false
            })
        } catch (err: unknown) {
            const pg = err as { code?: string }
            if(pg.code === "23505") res.status(409).json({
                error: "User is already an admin"
            })
            else next(err)
        }
    }

    async removeAdmin(req: Request, res: Response, next: NextFunction) {
        const id = parseId(req.params["id"])
        const userId = parseId(req.params["userId"])
        if(id === null || userId === null)
            return res.status(400).json({
                error: "id should be an integer"
            })

        try {
            const visible = await service.isVisible(res.locals.userId as number, id)
            if(!visible) return res.status(404).json({
                error: "Group not found"
            })

            const isSuperAdmin = await service.isSuperAdmin(res.locals.userId as number, id)
            if(!isSuperAdmin) return res.status(403).json({
                error: "Forbidden"
            })

            const removed = await service.removeAdmin(id, userId)
            if(!removed) return res.status(404).json({
                error: "Admin not found"
            })

            res.status(204).send()
        } catch(err) {
            next(err)
        }
    }
}

export default new GroupsController()