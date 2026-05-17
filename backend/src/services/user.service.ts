import bcrypt from "bcryptjs"
import repo from "../repositories/user.repo"
import { pickAccentColor } from "../utils/color"
import type { User, UserPublic, CreateUserDto, UpdateUserDto } from "../types/user"

const UPDATABLE_FIELDS = ['email', 'password', 'display_name', 'accent_color'] as const

class UsersService {
	async register(body: CreateUserDto): Promise<User> {
		const password = await bcrypt.hash(body.password, 10)
		const accent_color = pickAccentColor()
		return repo.create({ ...body, password, accent_color })
	}

	async getById(id: number): Promise<UserPublic | null> {
		return repo.findById(id)
	}

	async update(id: number, body: Record<string, unknown>): Promise<User | null> {
		const data: UpdateUserDto = {}

		for (const key of UPDATABLE_FIELDS) {
			if (key in body && typeof body[key] === 'string') {
				if (key === 'password') {
					data[key] = await bcrypt.hash(body[key] as string, 10)
				} else {
					data[key] = body[key] as string
				}
			}
		}

		if (Object.keys(data).length === 0) return null

		return repo.update(id, data)
	}

	async delete(id: number): Promise<boolean> {
		return repo.delete(id)
	}
}

export default new UsersService()