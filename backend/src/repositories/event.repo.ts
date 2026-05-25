import pool from "../db"
import type { PoolClient } from "pg"
import type { EventResolved, CreateEventDto, UpdateEventDto, EventRow, EventParticipantRow } from "../types/event"
import type { RecipientInput } from "../types/message"
import type { UserPublic } from "../types/user"
import { resolveRecipientUserIds } from "../utils/resolveRecipients"

const SELECT_BASE = `
    SELECT e.id, e.title, e.message_id, e.start_at, e.end_at, e.created_at,
        cb.id AS cb_id, cb.display_name AS cb_name, cb.accent_color AS cb_color
    FROM events e
    JOIN users cb ON cb.id = e.created_by`

async function fetchParticipants(eventIds: number[]): Promise<Map<number, UserPublic[]>> {
    if(eventIds.length === 0) return new Map()
    const { rows } = await pool.query<EventParticipantRow>(
        `SELECT ep.event_id, u.id AS p_id, u.display_name AS p_name, u.accent_color AS p_color
        FROM event_participants ep
        JOIN users u ON u.id = ep.user_id
        WHERE ep.event_id = ANY($1)
        ORDER BY ep.event_id, u.id`,
        [eventIds]
    )
    const map = new Map<number, UserPublic[]>()
    for (const r of rows) {
        const list = map.get(r.event_id) ?? []
        list.push({ id: r.p_id, display_name: r.p_name, accent_color: r.p_color })
        map.set(r.event_id, list)
    }
    return map
}

function mapRow(row: EventRow, participants: UserPublic[]): EventResolved {
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
        participants,
    }
}

export async function insertEventParticipants(client: PoolClient, eventId: number, userIds: number[]): Promise<void> {
    for (const uid of userIds) {
        await client.query(
            `INSERT INTO event_participants (event_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [eventId, uid]
        )
    }
}

class EventsRepository {
    async findById(id: number): Promise<EventResolved | null> {
        const { rows } = await pool.query<EventRow>(
            `${SELECT_BASE} WHERE e.id = $1`,
            [id]
        )
        const row = rows[0]
        if(!row) return null
        const pmap = await fetchParticipants([row.id])
        return mapRow(row, pmap.get(row.id) ?? [])
    }

    async findByUser(userId: number, from: string | null, to: string | null): Promise<EventResolved[]> {
        const conditions: string[] = [
            `(EXISTS (SELECT 1 FROM event_participants ep WHERE ep.event_id = e.id AND ep.user_id = $1) OR e.created_by = $1)`,
        ]
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
            `${SELECT_BASE} WHERE ${conditions.join(" AND ")} ORDER BY e.start_at`,
            values
        )
        if(rows.length === 0) return []
        const ids = rows.map(r => r.id)
        const pmap = await fetchParticipants(ids)
        return rows.map(r => mapRow(r, pmap.get(r.id) ?? []))
    }

    async findByMessageId(messageId: number): Promise<EventResolved[]> {
        const { rows } = await pool.query<EventRow>(
            `${SELECT_BASE} WHERE e.message_id = $1 ORDER BY e.start_at`,
            [messageId]
        )
        if(rows.length === 0) return []
        const ids = rows.map(r => r.id)
        const pmap = await fetchParticipants(ids)
        return rows.map(r => mapRow(r, pmap.get(r.id) ?? []))
    }

    async create(dto: CreateEventDto, createdBy: number): Promise<EventResolved> {
        const client = await pool.connect()
        try {
            await client.query("BEGIN")

            const { rows } = await client.query<{ id: number }>(
                `INSERT INTO events (title, created_by, message_id, start_at, end_at)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id`,
                [dto.title, createdBy, dto.message_id ?? null, dto.start_at, dto.end_at ?? null]
            )
            const eventId = rows[0]!.id

            const userIds = await resolveRecipientUserIds(client, dto.recipients)
            await insertEventParticipants(client, eventId, userIds)

            await client.query("COMMIT")
            return (await this.findById(eventId))!
        } catch (err) {
            await client.query("ROLLBACK")
            throw err
        } finally {
            client.release()
        }
    }

    async update(id: number, data: UpdateEventDto, recipients?: RecipientInput[]): Promise<EventResolved | null> {
        const client = await pool.connect()
        try {
            await client.query("BEGIN")

            const entries = Object.entries(data) as [string, unknown][]
            if(entries.length > 0) {
                const set = entries.map(([key], i) => `${key} = $${i + 2}`).join(", ")
                const values = entries.map(([, val]) => val)
                const { rowCount } = await client.query(
                    `UPDATE events SET ${set} WHERE id = $1`,
                    [id, ...values]
                )
                if((rowCount ?? 0) === 0) {
                    await client.query("ROLLBACK")
                    return null
                }
            }

            if(recipients !== undefined) {
                await client.query(`DELETE FROM event_participants WHERE event_id = $1`, [id])
                const userIds = await resolveRecipientUserIds(client, recipients)
                await insertEventParticipants(client, id, userIds)
            }

            await client.query("COMMIT")
            return this.findById(id)
        } catch (err) {
            await client.query("ROLLBACK")
            throw err
        } finally {
            client.release()
        }
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