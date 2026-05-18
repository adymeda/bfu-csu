import pool from "../db"
import type { UserPublic, User, CreateUserDto, UpdateUserDto } from "../types/user"

class UsersRepository {
    async create(data: CreateUserDto & { accent_color: string }): Promise<User> {
        const { rows } = await pool.query<User>(
            `INSERT INTO users (email, password, display_name, accent_color)
                VALUES ($1, $2, $3, $4)
                RETURNING id, email, display_name, accent_color, created_at, last_login_at`,
            [data.email, data.password, data.display_name, data.accent_color]
        )
        return rows[0]!
    }

    async findById(id: number): Promise<UserPublic | null> {
        const { rows } = await pool.query<UserPublic>(
            `SELECT id, display_name, accent_color FROM users WHERE id = $1`,
            [id]
        )
        return rows[0] ?? null
    }

    async update(id: number, data: UpdateUserDto): Promise<User | null> {
        const entries = Object.entries(data) as [string, string][]
        const set = entries.map(([key], i) => `${key} = $${i + 2}`).join(', ')
        const values = entries.map(([, val]) => val)

        const { rows } = await pool.query<User>(
            `UPDATE users SET ${set} WHERE id = $1
                RETURNING id, email, display_name, accent_color, created_at, last_login_at`,
            [id, ...values]
        )
        return rows[0] ?? null
    }

    async delete(id: number): Promise<boolean> {
        const { rowCount } = await pool.query(
            `DELETE FROM users WHERE id = $1`,
            [id]
        )
        return (rowCount ?? 0) > 0
    }

    async getLoginData(email: string): Promise<(User & { password: string }) | null> {
        const { rows } = await pool.query<User & { password: string }>(
            `SELECT id, email, display_name, accent_color, created_at, last_login_at, password
                FROM users WHERE email = $1`,
            [email]
        )
        return rows[0] ?? null
    }

    async updateLastLogin(id: number): Promise<void> {
        await pool.query(
            `UPDATE users SET last_login_at = now() WHERE id = $1`,
            [id]
        )
    }
}

export default new UsersRepository()