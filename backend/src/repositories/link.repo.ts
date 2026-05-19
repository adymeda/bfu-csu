import pool from "../db"
import type { LinkPublic, CreateLinkDto } from "../types/link"

class LinksRepository {
    async findByUser(userId: number): Promise<LinkPublic[]> {
        const { rows } = await pool.query<LinkPublic>(
            `SELECT link_type, link_value FROM links WHERE user_id = $1`,
            [userId]
        )
        return rows
    }

    async create(userId: number, dto: CreateLinkDto): Promise<LinkPublic> {
        const { rows } = await pool.query<LinkPublic>(
            `INSERT INTO links (user_id, link_type, link_value)
                VALUES ($1, $2, $3)
                RETURNING link_type, link_value`,
            [userId, dto.link_type, dto.link_value]
        )
        return rows[0]!
    }

    async delete(userId: number, linkType: number): Promise<boolean> {
        const { rowCount } = await pool.query(
            `DELETE FROM links WHERE user_id = $1 AND link_type = $2`,
            [userId, linkType]
        )
        return (rowCount ?? 0) > 0
    }
}

export default new LinksRepository()