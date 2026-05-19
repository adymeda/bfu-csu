import pool from "../db"
import type { DeadlineResolved, CreateDeadlineDto, UpdateDeadlineDto } from "../types/deadline"

interface DeadlineRow {
    id: number
    title: string
    message_id: number | null
    due_at: Date
    created_at: Date
    cb_id: number
    cb_name: string
    cb_color: string
    a_id: number
    a_name: string
    a_color: string
}

const SELECT_RESOLVED = `
    SELECT d.id, d.title, d.message_id, d.due_at, d.created_at,
        cb.id AS cb_id, cb.display_name AS cb_name, cb.accent_color AS cb_color,
        a.id AS a_id, a.display_name AS a_name, a.accent_color AS a_color
    FROM deadlines d
    JOIN users cb ON cb.id = d.created_by
    JOIN users a ON a.id = d.assignee_id`

function mapRow(row: DeadlineRow): DeadlineResolved {
    return {
        id: row.id,
        title: row.title,
        message_id: row.message_id,
        due_at: row.due_at,
        created_at: row.created_at,
        created_by: {
            id: row.cb_id,
            display_name: row.cb_name,
            accent_color: row.cb_color,
        },
        assignee: {
            id: row.a_id,
            display_name: row.a_name,
            accent_color: row.a_color,
        },
    }
}

class DeadlinesRepository {
    async findById(id: number): Promise<DeadlineResolved | null> {
        const { rows } = await pool.query<DeadlineRow>(
            `${SELECT_RESOLVED}
            WHERE d.id = $1`,
            [id]
        )
        const row = rows[0]
        return row ? mapRow(row) : null
    }

    async findByUser(userId: number, from: string | null, to: string | null): Promise<DeadlineResolved[]> {
        const conditions: string[] = ["(d.assignee_id = $1 OR d.created_by = $1)"]
        const values: unknown[] = [userId]
        let paramIdx = 2

        if(from !== null) {
            conditions.push(`d.due_at >= $${paramIdx++}`)
            values.push(from)
        }
        if(to !== null) {
            conditions.push(`d.due_at <= $${paramIdx++}`)
            values.push(to)
        }

        const { rows } = await pool.query<DeadlineRow>(
            `${SELECT_RESOLVED}
            WHERE ${conditions.join(" AND ")}
            ORDER BY d.due_at`,
            values
        )
        return rows.map(mapRow)
    }

    async findByMessageId(messageId: number): Promise<DeadlineResolved[]> {
        const { rows } = await pool.query<DeadlineRow>(
            `${SELECT_RESOLVED}
            WHERE d.message_id = $1
            ORDER BY d.due_at`,
            [messageId]
        )
        return rows.map(mapRow)
    }

    async create(dto: CreateDeadlineDto, createdBy: number): Promise<DeadlineResolved> {
        const { rows } = await pool.query<{ id: number }>(
            `INSERT INTO deadlines (title, created_by, assignee_id, message_id, due_at)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id`,
            [dto.title, createdBy, dto.assignee_id, dto.message_id ?? null, dto.due_at]
        )
        return (await this.findById(rows[0]!.id))!
    }

    async update(id: number, data: UpdateDeadlineDto): Promise<DeadlineResolved | null> {
        const entries = Object.entries(data) as [string, unknown][]
        const set = entries.map(([key], i) => `${key} = $${i + 2}`).join(", ")
        const values = entries.map(([, val]) => val)
        const { rowCount } = await pool.query(
            `UPDATE deadlines SET ${set} WHERE id = $1`,
            [id, ...values]
        )
        if((rowCount ?? 0) === 0) return null
        return this.findById(id)
    }

    async delete(id: number): Promise<boolean> {
        const { rowCount } = await pool.query(
            `DELETE FROM deadlines WHERE id = $1`,
            [id]
        )
        return (rowCount ?? 0) > 0
    }

    async getCreatedBy(id: number): Promise<number | null> {
        const { rows } = await pool.query<{ created_by: number }>(
            `SELECT created_by FROM deadlines WHERE id = $1`,
            [id]
        )
        return rows[0]?.created_by ?? null
    }
}

export default new DeadlinesRepository()