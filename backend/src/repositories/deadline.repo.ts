import pool from "../db"
import type { PoolClient } from "pg"
import type { DeadlineResolved, CreateDeadlineDto, UpdateDeadlineDto, DeadlineRow, DeadlineParticipantRow } from "../types/deadline"
import type { RecipientInput } from "../types/message"
import type { UserPublic } from "../types/user"
import { resolveRecipientUserIds } from "../utils/resolveRecipients"

const SELECT_BASE = `
    SELECT d.id, d.title, d.message_id, d.due_at, d.created_at,
        cb.id AS cb_id, cb.display_name AS cb_name, cb.accent_color AS cb_color
    FROM deadlines d
    JOIN users cb ON cb.id = d.created_by`

async function fetchParticipants(deadlineIds: number[]): Promise<Map<number, UserPublic[]>> {
    if(deadlineIds.length === 0) return new Map()
    const { rows } = await pool.query<DeadlineParticipantRow>(
        `SELECT da.deadline_id, u.id AS p_id, u.display_name AS p_name, u.accent_color AS p_color
        FROM deadline_assignees da
        JOIN users u ON u.id = da.user_id
        WHERE da.deadline_id = ANY($1)
        ORDER BY da.deadline_id, u.id`,
        [deadlineIds]
    )
    const map = new Map<number, UserPublic[]>()
    for (const r of rows) {
        const list = map.get(r.deadline_id) ?? []
        list.push({ id: r.p_id, display_name: r.p_name, accent_color: r.p_color })
        map.set(r.deadline_id, list)
    }
    return map
}

function mapRow(row: DeadlineRow, participants: UserPublic[]): DeadlineResolved {
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
        participants,
    }
}

export async function insertDeadlineAssignees(client: PoolClient, deadlineId: number, userIds: number[]): Promise<void> {
    for (const uid of userIds) {
        await client.query(
            `INSERT INTO deadline_assignees (deadline_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [deadlineId, uid]
        )
    }
}

class DeadlinesRepository {
    async findById(id: number): Promise<DeadlineResolved | null> {
        const { rows } = await pool.query<DeadlineRow>(
            `${SELECT_BASE} WHERE d.id = $1`,
            [id]
        )
        const row = rows[0]
        if(!row) return null
        const pmap = await fetchParticipants([row.id])
        return mapRow(row, pmap.get(row.id) ?? [])
    }

    async findByUser(userId: number, from: string | null, to: string | null): Promise<DeadlineResolved[]> {
        const conditions: string[] = [
            `(EXISTS (SELECT 1 FROM deadline_assignees da WHERE da.deadline_id = d.id AND da.user_id = $1) OR d.created_by = $1)`,
        ]
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
            `${SELECT_BASE} WHERE ${conditions.join(" AND ")} ORDER BY d.due_at`,
            values
        )
        if(rows.length === 0) return []
        const ids = rows.map(r => r.id)
        const pmap = await fetchParticipants(ids)
        return rows.map(r => mapRow(r, pmap.get(r.id) ?? []))
    }

    async findByMessageId(messageId: number): Promise<DeadlineResolved[]> {
        const { rows } = await pool.query<DeadlineRow>(
            `${SELECT_BASE} WHERE d.message_id = $1 ORDER BY d.due_at`,
            [messageId]
        )
        if(rows.length === 0) return []
        const ids = rows.map(r => r.id)
        const pmap = await fetchParticipants(ids)
        return rows.map(r => mapRow(r, pmap.get(r.id) ?? []))
    }

    async create(dto: CreateDeadlineDto, createdBy: number): Promise<DeadlineResolved> {
        const client = await pool.connect()
        try {
            await client.query("BEGIN")

            const { rows } = await client.query<{ id: number }>(
                `INSERT INTO deadlines (title, created_by, message_id, due_at)
                VALUES ($1, $2, $3, $4)
                RETURNING id`,
                [dto.title, createdBy, dto.message_id ?? null, dto.due_at]
            )
            const deadlineId = rows[0]!.id

            const userIds = await resolveRecipientUserIds(client, dto.recipients)
            await insertDeadlineAssignees(client, deadlineId, userIds)

            await client.query("COMMIT")
            return (await this.findById(deadlineId))!
        } catch (err) {
            await client.query("ROLLBACK")
            throw err
        } finally {
            client.release()
        }
    }

    async update(id: number, data: UpdateDeadlineDto, recipients?: RecipientInput[]): Promise<DeadlineResolved | null> {
        const client = await pool.connect()
        try {
            await client.query("BEGIN")

            const entries = Object.entries(data) as [string, unknown][]
            if(entries.length > 0) {
                const set = entries.map(([key], i) => `${key} = $${i + 2}`).join(", ")
                const values = entries.map(([, val]) => val)
                const { rowCount } = await client.query(
                    `UPDATE deadlines SET ${set} WHERE id = $1`,
                    [id, ...values]
                )
                if((rowCount ?? 0) === 0) {
                    await client.query("ROLLBACK")
                    return null
                }
            }

            if(recipients !== undefined) {
                await client.query(`DELETE FROM deadline_assignees WHERE deadline_id = $1`, [id])
                const userIds = await resolveRecipientUserIds(client, recipients)
                await insertDeadlineAssignees(client, id, userIds)
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