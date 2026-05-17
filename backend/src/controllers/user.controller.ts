import { Request, Response } from "express"
import service from "../services/user.service"
import type { CreateUserDto } from "../types/user"

class UsersController {
	async register(req: Request, res: Response) {
		const { email, password, display_name } = req.body as CreateUserDto

		if(!email) return res.status(400).json({
			error: "email should be specified"
		})

		if(!password) return res.status(400).json({
			error: "password field should be specified"
		})

		if(!display_name) return res.status(400).json({
			error: "display_name should be specified"
		})

		try {
			const user = await service.register({ email, password, display_name })
			
			res.status(201).json(user)
		} catch (err: unknown) {
			const pg = err as { code?: string }
			if (pg.code === '23505') res.status(409).json({ error: "email already claimed" })
			else res.status(500).json({ error: "Internal Server Error" })
		}
	}

	async getById(req: Request, res: Response) {
		const id = parseInt(req.params['id'] as string)

		if (isNaN(id)) return res.status(400).json({
			error: "id should be a number"
		})

		try {
			const user = await service.getById(id)
			if (!user) return res.status(404).json({
				error: "User not found"
			})

			res.json(user)
		} catch {
			res.status(500).json({
				error: "Internal Server Error"
			})
		}
	}

	async update(req: Request, res: Response) {
		const id = parseInt(req.params['id'] as string)

		if (isNaN(id)) return res.status(400).json({
			error: "id should be a number"
		})

		try {
			const user = await service.update(id, req.body as Record<string, unknown>)
			if (!user) return res.status(400).json({
				error: "No fields to update"
			})

			res.json(user)
		} catch {
			res.status(500).json({
				error: "Internal Server Error"
			})
		}
	}

	async delete(req: Request, res: Response) {
		const id = parseInt(req.params['id'] as string)

		if (isNaN(id)) return res.status(400).json({
			error: "id should be a number"
		})

		try {
			const deleted = await service.delete(id)
			if (!deleted) return res.status(404).json({
				error: "User not found"
			})

			res.status(204).send()
		} catch {
			res.status(500).json({
				error: "Internal Server Error"
			})
		}
	}
}

export default new UsersController()