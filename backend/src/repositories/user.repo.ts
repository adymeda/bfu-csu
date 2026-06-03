import pool from "../db"
import type { UserPublic, User, CreateUserDto, UpdateUserDto } from "../types/user"
import type { GroupPublic } from "../types/group"

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

    async list(params: { q?: string, limit: number, offset: number }): Promise<{ items: UserPublic[], total: number }> {
        const conditions: string[] = []
        const values: unknown[] = []

        if(params.q !== undefined) {
            values.push(`%${params.q}%`)
            conditions.push(`display_name ILIKE $${values.length}`)
        }

        const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

        const { rows: countRows } = await pool.query<{ count: string }>(
            `SELECT count(*)::int AS count FROM users ${where}`,
            values
        )
        const total = Number(countRows[0]?.count ?? 0)

        const { rows } = await pool.query<UserPublic>(
            `SELECT id, display_name, accent_color FROM users ${where}
                ORDER BY display_name
                LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
            [...values, params.limit, params.offset]
        )
        return { items: rows, total }
    }

    async findById(id: number): Promise<UserPublic | null> {
        const { rows } = await pool.query<UserPublic>(
            `SELECT id, display_name, accent_color FROM users WHERE id = $1`,
            [id]
        )
        return rows[0] ?? null
    }

    async findUserById(id: number): Promise<User | null> {
        const { rows } = await pool.query<User>(
            `SELECT id, email, display_name, accent_color, created_at, last_login_at
                FROM users WHERE id = $1`,
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

    async isGlobalAdmin(userId: number): Promise<boolean> {
        const { rows } = await pool.query<{ ok: boolean }>(
            `SELECT EXISTS (
                SELECT 1 FROM group_admins ga
                JOIN groups g ON g.id = ga.group_id
                WHERE g.parent_id IS NULL AND ga.is_super = true AND ga.user_id = $1
            ) AS ok`,
            [userId]
        )
        return rows[0]?.ok ?? false
    }

    async findByDisplayName(name: string): Promise<UserPublic | null> {
        const { rows } = await pool.query<UserPublic>(
            `SELECT id, display_name, accent_color FROM users
            WHERE lower(display_name) = lower($1)
               OR lower(display_name) LIKE lower($1) || ' %'
            ORDER BY
                CASE WHEN lower(display_name) = lower($1) THEN 0 ELSE 1 END
            LIMIT 1`,
            [name]
        )
        return rows[0] ?? null
    }

    async findGroups(userId: number): Promise<(GroupPublic & { position: string | null })[]> {
        const { rows } = await pool.query<GroupPublic & { position: string | null }>(
            `SELECT g.id, g.name, g.parent_id, gr.position
            FROM group_members gm
            JOIN groups g ON g.id = gm.group_id
            LEFT JOIN group_roles gr ON gr.group_id = gm.group_id AND gr.user_id = gm.user_id
            WHERE gm.user_id = $1
            ORDER BY g.name`,
            [userId]
        )
        return rows
    }
}

export default new UsersRepository()