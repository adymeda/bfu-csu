import pool from "../db"
import type { Session } from "../types/auth"

class AuthRepository {
    async createSession(userId: number, tokenHash: string, expiresAt: Date): Promise<Session> {
        const { rows } = await pool.query<Session>(
            `INSERT INTO sessions (user_id, token, expires_at)
            VALUES ($1, $2, $3)
            RETURNING *`,
            [userId, tokenHash, expiresAt]
        )
        return rows[0]!
    }

    async findByTokenHash(tokenHash: string): Promise<Session | null> {
        const { rows } = await pool.query<Session>(
            `SELECT * FROM sessions WHERE token = $1`,
            [tokenHash]
        )
        return rows[0] ?? null
    }

    async deleteByTokenHash(tokenHash: string): Promise<boolean> {
        const { rowCount } = await pool.query(
            `DELETE FROM sessions WHERE token = $1`,
            [tokenHash]
        )
        return (rowCount ?? 0) > 0
    }
}

export default new AuthRepository()