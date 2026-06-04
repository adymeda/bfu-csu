import pool from "../db"
import type { Message, MessageListItem, MessageDetail, RecipientInput, MessageRecipientResolved, MessageListQuery, MessageStateUpdate, EventResolved, DeadlineResolved, MessageListRow, RecipientJoinRow } from "../types/message"
import { RECIPIENT_TYPE } from "../types/message"
import type { CreateEventDto } from "../types/event"
import type { EventRow, EventParticipantRow } from "../types/event"
import type { CreateDeadlineDto } from "../types/deadline"
import type { DeadlineRow, DeadlineParticipantRow } from "../types/deadline"
import attachmentRepo from "./attachment.repo"
import { insertEventParticipants } from "./event.repo"
import { insertDeadlineAssignees } from "./deadline.repo"

class MessagesRepository {
    async createMessage(
        data: { sender_id: number, title: string, content: string, reply_to: number | null, forwarded_from: number | null },
        recipients: RecipientInput[],
        events: CreateEventDto[],
        deadlines: CreateDeadlineDto[],
        attachmentIds: number[] = []
    ): Promise<Message> {
        const client = await pool.connect()
        try {
            await client.query("BEGIN")

            const { rows: msgRows } = await client.query<Message>(
                `INSERT INTO messages (sender_id, title, content, reply_to, forwarded_from)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id, sender_id, title, content, reply_to, forwarded_from, created_at`,
                [data.sender_id, data.title, data.content, data.reply_to, data.forwarded_from]
            )
            const message = msgRows[0]!

            for (const r of recipients) {
                await client.query(
                    `INSERT INTO message_recipients (message_id, recipient_type, recipient_id)
                    VALUES ($1, $2, $3)`,
                    [message.id, r.type, r.id]
                )
            }

            const directUserIds = recipients
                .filter(r => r.type === RECIPIENT_TYPE.USER)
                .map(r => r.id)

            const groupIds = recipients
                .filter(r => r.type === RECIPIENT_TYPE.GROUP)
                .map(r => r.id)

            let memberIds: number[] = []
            if(groupIds.length > 0) {
                const { rows } = await client.query<{ user_id: number }>(
                    `SELECT DISTINCT user_id FROM group_members WHERE group_id = ANY($1)`,
                    [groupIds]
                )
                memberIds = rows.map(r => r.user_id)
            }

            const allUserIds = [...new Set([...directUserIds, ...memberIds])]

            for (const userId of allUserIds) {
                await client.query(
                    `INSERT INTO message_states (message_id, user_id)
                    VALUES ($1, $2)
                    ON CONFLICT (message_id, user_id) DO NOTHING`,
                    [message.id, userId]
                )
            }

            for (const event of events) {
                const { rows: evRows } = await client.query<{ id: number }>(
                    `INSERT INTO events (title, created_by, message_id, start_at, end_at)
                    VALUES ($1, $2, $3, $4, $5)
                    RETURNING id`,
                    [event.title, data.sender_id, message.id, event.start_at, event.end_at ?? null]
                )
                await insertEventParticipants(client, evRows[0]!.id, allUserIds)
            }

            for (const deadline of deadlines) {
                const { rows: dlRows } = await client.query<{ id: number }>(
                    `INSERT INTO deadlines (title, created_by, message_id, due_at)
                    VALUES ($1, $2, $3, $4)
                    RETURNING id`,
                    [deadline.title, data.sender_id, message.id, deadline.due_at]
                )
                await insertDeadlineAssignees(client, dlRows[0]!.id, allUserIds)
            }

            if(attachmentIds.length > 0) {
                await attachmentRepo.linkToMessage(client, attachmentIds, data.sender_id, message.id)
            }

            if(data.forwarded_from !== null) {
                await attachmentRepo.copyAttachments(client, data.forwarded_from, message.id)
            }

            await client.query("COMMIT")
            return message
        } catch (err) {
            await client.query("ROLLBACK")
            throw err
        } finally {
            client.release()
        }
    }

    async hasAccess(messageId: number, userId: number): Promise<boolean> {
        const { rows } = await pool.query<{ has_access: boolean }>(
            `SELECT EXISTS(
                SELECT 1 FROM messages m
                WHERE m.id = $1
                AND (
                    m.sender_id = $2
                    OR EXISTS(SELECT 1 FROM message_states ms WHERE ms.message_id = $1 AND ms.user_id = $2)
                )
            ) AS has_access`,
            [messageId, userId]
        )
        return rows[0]?.has_access ?? false
    }

    async findById(messageId: number): Promise<Message | null> {
        const { rows } = await pool.query<Message>(
            `SELECT id, sender_id, title, content, reply_to, forwarded_from, created_at
            FROM messages WHERE id = $1`,
            [messageId]
        )
        return rows[0] ?? null
    }

    async findListByUser(userId: number, query: MessageListQuery): Promise<MessageListItem[]> {
        const { box, limit, before, favorite, unread, category, requires_response, has_events, has_deadlines } = query
        const values: unknown[] = [userId]
        let paramIdx = 2

        const conditions: string[] = []

        let stateJoin: string
        if(box === "sent") {
            conditions.push("m.sender_id = $1")
            stateJoin = "LEFT JOIN message_states s ON s.message_id = m.id AND s.user_id = $1"
        } else {
            conditions.push("s.user_id = $1", "s.is_deleted = false")
            stateJoin = "JOIN message_states s ON s.message_id = m.id AND s.user_id = $1"
        }

        if(before !== null) {
            conditions.push(`m.id < $${paramIdx++}`)
            values.push(before)
        }
        if(favorite) conditions.push("COALESCE(s.is_favorite, false) = true")
        if(unread) conditions.push("COALESCE(s.is_read, false) = false")
        if(category !== null) {
            conditions.push(`t.category = $${paramIdx++}`)
            values.push(category)
        }
        if(requires_response) conditions.push("t.requires_response = true")
        if(has_events) conditions.push("EXISTS (SELECT 1 FROM events e WHERE e.message_id = m.id)")
        if(has_deadlines) conditions.push("EXISTS (SELECT 1 FROM deadlines d WHERE d.message_id = m.id)")

        values.push(limit)
        const limitParam = `$${paramIdx}`

        const where = conditions.join(" AND ")

        const { rows } = await pool.query<MessageListRow>(
            `SELECT
                m.id, m.title, m.content, m.reply_to, m.forwarded_from, m.created_at,
                u.id AS sender_id, u.display_name AS sender_display_name, u.accent_color AS sender_accent_color,
                COALESCE(s.is_read, false) AS is_read,
                COALESCE(s.is_favorite, false) AS is_favorite,
                t.category, t.requires_response
            FROM messages m
            ${stateJoin}
            JOIN users u ON u.id = m.sender_id
            LEFT JOIN message_tags t ON t.message_id = m.id
            WHERE ${where}
            ORDER BY m.id DESC
            LIMIT ${limitParam}`,
            values
        )

        return rows.map(row => ({
            id: row.id,
            title: row.title,
            content: row.content,
            reply_to: row.reply_to,
            forwarded_from: row.forwarded_from,
            created_at: row.created_at,
            sender: {
                id: row.sender_id,
                display_name: row.sender_display_name,
                accent_color: row.sender_accent_color,
            },
            is_read: row.is_read,
            is_favorite: row.is_favorite,
            category: row.category ?? null,
            requires_response: row.requires_response ?? null,
        }))
    }

    async findDetailById(messageId: number, userId: number): Promise<MessageDetail | null> {
        const { rows: msgRows } = await pool.query<MessageListRow>(
            `SELECT
                m.id, m.title, m.content, m.reply_to, m.forwarded_from, m.created_at,
                m.sender_id, u.display_name AS sender_display_name, u.accent_color AS sender_accent_color,
                COALESCE(s.is_read, false) AS is_read,
                COALESCE(s.is_favorite, false) AS is_favorite,
                t.category, t.requires_response
            FROM messages m
            JOIN users u ON u.id = m.sender_id
            LEFT JOIN message_states s ON s.message_id = m.id AND s.user_id = $2
            LEFT JOIN message_tags t ON t.message_id = m.id
            WHERE m.id = $1`,
            [messageId, userId]
        )
        const msg = msgRows[0]
        if(!msg) return null

        const { rows: recipientRows } = await pool.query<RecipientJoinRow>(
            `SELECT
                mr.recipient_type AS type,
                mr.recipient_id AS id,
                COALESCE(u.display_name, g.name, 'Unknown') AS name,
                u.accent_color
            FROM message_recipients mr
            LEFT JOIN users u ON mr.recipient_type = 0 AND u.id = mr.recipient_id
            LEFT JOIN groups g ON mr.recipient_type = 1 AND g.id = mr.recipient_id
            WHERE mr.message_id = $1
            ORDER BY mr.recipient_type, mr.recipient_id`,
            [messageId]
        )

        const { rows: eventRows } = await pool.query<EventRow>(
            `SELECT e.id, e.title, e.message_id, e.start_at, e.end_at, e.created_at,
                cb.id AS cb_id, cb.display_name AS cb_name, cb.accent_color AS cb_color
            FROM events e
            JOIN users cb ON cb.id = e.created_by
            WHERE e.message_id = $1
            ORDER BY e.start_at`,
            [messageId]
        )

        const { rows: eventParticipantRows } = await pool.query<EventParticipantRow>(
            `SELECT ep.event_id, u.id AS p_id, u.display_name AS p_name, u.accent_color AS p_color
            FROM event_participants ep
            JOIN users u ON u.id = ep.user_id
            WHERE ep.event_id = ANY($1)
            ORDER BY ep.event_id, u.id`,
            [eventRows.map(r => r.id)]
        )

        const eventParticipantsMap = new Map<number, { id: number, display_name: string, accent_color: string }[]>()
        for (const r of eventParticipantRows) {
            const list = eventParticipantsMap.get(r.event_id) ?? []
            list.push({ id: r.p_id, display_name: r.p_name, accent_color: r.p_color })
            eventParticipantsMap.set(r.event_id, list)
        }

        const { rows: deadlineRows } = await pool.query<DeadlineRow>(
            `SELECT d.id, d.title, d.message_id, d.due_at, d.created_at,
                cb.id AS cb_id, cb.display_name AS cb_name, cb.accent_color AS cb_color
            FROM deadlines d
            JOIN users cb ON cb.id = d.created_by
            WHERE d.message_id = $1
            ORDER BY d.due_at`,
            [messageId]
        )

        const { rows: deadlineAssigneeRows } = await pool.query<DeadlineParticipantRow>(
            `SELECT da.deadline_id, u.id AS p_id, u.display_name AS p_name, u.accent_color AS p_color
            FROM deadline_assignees da
            JOIN users u ON u.id = da.user_id
            WHERE da.deadline_id = ANY($1)
            ORDER BY da.deadline_id, u.id`,
            [deadlineRows.map(r => r.id)]
        )

        const deadlineAssigneesMap = new Map<number, { id: number, display_name: string, accent_color: string }[]>()
        for (const r of deadlineAssigneeRows) {
            const list = deadlineAssigneesMap.get(r.deadline_id) ?? []
            list.push({ id: r.p_id, display_name: r.p_name, accent_color: r.p_color })
            deadlineAssigneesMap.set(r.deadline_id, list)
        }

        const attachments = await attachmentRepo.findByMessageId(messageId)

        return {
            id: msg.id,
            title: msg.title,
            content: msg.content,
            reply_to: msg.reply_to,
            forwarded_from: msg.forwarded_from,
            created_at: msg.created_at,
            sender: {
                id: msg.sender_id,
                display_name: msg.sender_display_name,
                accent_color: msg.sender_accent_color,
            },
            is_read: msg.is_read,
            is_favorite: msg.is_favorite,
            category: msg.category ?? null,
            requires_response: msg.requires_response ?? null,
            recipients: recipientRows.map(r => ({
                type: r.type,
                id: r.id,
                name: r.name,
                accent_color: r.accent_color ?? null,
            } satisfies MessageRecipientResolved)),
            events: eventRows.map(r => ({
                id: r.id,
                title: r.title,
                message_id: r.message_id,
                start_at: r.start_at,
                end_at: r.end_at,
                created_at: r.created_at,
                created_by: { id: r.cb_id, display_name: r.cb_name, accent_color: r.cb_color },
                participants: eventParticipantsMap.get(r.id) ?? [],
            } satisfies EventResolved)),
            deadlines: deadlineRows.map(r => ({
                id: r.id,
                title: r.title,
                message_id: r.message_id,
                due_at: r.due_at,
                created_at: r.created_at,
                created_by: { id: r.cb_id, display_name: r.cb_name, accent_color: r.cb_color },
                participants: deadlineAssigneesMap.get(r.id) ?? [],
            } satisfies DeadlineResolved)),
            attachments,
        }
    }

    async setState(messageId: number, userId: number, dto: MessageStateUpdate): Promise<boolean> {
        const { rowCount } = await pool.query(
            `UPDATE message_states SET ${dto.field} = $3 WHERE message_id = $1 AND user_id = $2`,
            [messageId, userId, dto.value]
        )
        return (rowCount ?? 0) > 0
    }

    async upsertTag(messageId: number, category: string, requiresResponse: boolean): Promise<void> {
        await pool.query(
            `INSERT INTO message_tags (message_id, category, requires_response)
            VALUES ($1, $2, $3)
            ON CONFLICT (message_id) DO UPDATE
                SET category = $2, requires_response = $3, updated_at = now()`,
            [messageId, category, requiresResponse]
        )
    }
}

export default new MessagesRepository()