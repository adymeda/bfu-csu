import pool from "../db"
import type { EventResolved, CreateEventDto, UpdateEventDto } from "../types/event"

interface EventRow {
    id: number
    title: string
    message_id: number | null
    start_at: Date
    end_at: Date | null
    created_at: Date
    cb_id: number
    cb_name: string
    cb_color: string
    a_id: number
    a_name: string
    a_color: string
}

const SELECT_RESOLVED = `
    SELECT e.id, e.title, e.message_id, e.start_at, e.end_at, e.created_at,
        cb.id AS cb_id, cb.display_name AS cb_name, cb.accent_color AS cb_color,
        a.id AS a_id, a.display_name AS a_name, a.accent_color AS a_color
    FROM events e
    JOIN users cb ON cb.id = e.created_by
    JOIN users a ON a.id = e.assignee_id`

function mapRow(row: EventRow): EventResolved {
    return {
        id: row.id,
        title: row.title,
        message_id: row.message_id,
        start_at: row.start_at,
        end_at: row.end_at,
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

class EventsRepository {
    async findById(id: number): Promise<EventResolved | null> {
        const { rows } = await pool.query<EventRow>(
            `${SELECT_RESOLVED}
            WHERE e.id = $1`,
            [id]
        )
        const row = rows[0]
        return row ? mapRow(row) : null
    }

    async findByUser(userId: number, from: string | null, to: string | null): Promise<EventResolved[]> {
        const conditions: string[] = ["(e.assignee_id = $1 OR e.created_by = $1)"]
        const values: unknown[] = [userId]
        let paramIdx = 2

        if(to !== null) {
            conditions.push(`e.start_at <= $${paramIdx++}`)
            values.push(to)
        }
        if(from !== null) {
            conditions.push(`(e.end_at IS NULL OR e.end_at >= $${paramIdx++})`)
            values.push(from)
        }

        const { rows } = await pool.query<EventRow>(
            `${SELECT_RESOLVED}
            WHERE ${conditions.join(" AND ")}
            ORDER BY e.start_at`,
            values
        )
        return rows.map(mapRow)
    }

    async findByMessageId(messageId: number): Promise<EventResolved[]> {
        const { rows } = await pool.query<EventRow>(
            `${SELECT_RESOLVED}
            WHERE e.message_id = $1
            ORDER BY e.start_at`,
            [messageId]
        )
        return rows.map(mapRow)
    }

    async create(dto: CreateEventDto, createdBy: number): Promise<EventResolved> {
        const { rows } = await pool.query<{ id: number }>(
            `INSERT INTO events (title, created_by, assignee_id, message_id, start_at, end_at)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id`,
            [dto.title, createdBy, dto.assignee_id, dto.message_id ?? null, dto.start_at, dto.end_at ?? null]
        )
        return (await this.findById(rows[0]!.id))!
    }

    async update(id: number, data: UpdateEventDto): Promise<EventResolved | null> {
        const entries = Object.entries(data) as [string, unknown][]
        const set = entries.map(([key], i) => `${key} = $${i + 2}`).join(", ")
        const values = entries.map(([, val]) => val)
        const { rowCount } = await pool.query(
            `UPDATE events SET ${set} WHERE id = $1`,
            [id, ...values]
        )
        if((rowCount ?? 0) === 0) return null
        return this.findById(id)
    }

    async delete(id: number): Promise<boolean> {
        const { rowCount } = await pool.query(
            `DELETE FROM events WHERE id = $1`,
            [id]
        )
        return (rowCount ?? 0) > 0
    }

    async getCreatedBy(id: number): Promise<number | null> {
        const { rows } = await pool.query<{ created_by: number }>(
            `SELECT created_by FROM events WHERE id = $1`,
            [id]
        )
        return rows[0]?.created_by ?? null
    }
}

export default new EventsRepository()