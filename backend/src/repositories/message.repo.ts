import pool from "../db"
import type { Message, MessageListItem, MessageDetail, RecipientInput, MessageRecipientResolved, MessageListQuery, MessageStateUpdate } from "../types/message"
import { RECIPIENT_TYPE } from "../types/message"

interface MessageListRow {
    id: number
    title: string
    content: string
    reply_to: number | null
    forwarded_from: number | null
    created_at: Date
    sender_id: number
    sender_display_name: string
    sender_accent_color: string
    is_read: boolean
    is_favorite: boolean
}

interface MessageDetailRow extends MessageListRow {
    is_read: boolean
    is_favorite: boolean
}

interface RecipientRow {
    type: number
    id: number
    name: string
    accent_color: string | null
}

class MessagesRepository {
    async createMessage(
        data: { sender_id: number, title: string, content: string, reply_to: number | null, forwarded_from: number | null },
        recipients: RecipientInput[]
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
        const { limit, before, favorite, unread } = query
        const conditions: string[] = ["s.user_id = $1", "s.is_deleted = false"]
        const values: unknown[] = [userId]
        let paramIdx = 2

        if(before !== null) {
            conditions.push(`m.id < $${paramIdx++}`)
            values.push(before)
        }
        if(favorite) conditions.push("s.is_favorite = true")
        if(unread) conditions.push("s.is_read = false")

        values.push(limit)
        const limitParam = `$${paramIdx}`

        const where = conditions.join(" AND ")

        const { rows } = await pool.query<MessageListRow>(
            `SELECT
                m.id, m.title, m.content, m.reply_to, m.forwarded_from, m.created_at,
                u.id AS sender_id, u.display_name AS sender_display_name, u.accent_color AS sender_accent_color,
                s.is_read, s.is_favorite
            FROM messages m
            JOIN message_states s ON s.message_id = m.id
            JOIN users u ON u.id = m.sender_id
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
        }))
    }

    async findDetailById(messageId: number, userId: number): Promise<MessageDetail | null> {
        const { rows: msgRows } = await pool.query<MessageDetailRow>(
            `SELECT
                m.id, m.title, m.content, m.reply_to, m.forwarded_from, m.created_at,
                m.sender_id, u.display_name AS sender_display_name, u.accent_color AS sender_accent_color,
                s.is_read, s.is_favorite
            FROM messages m
            JOIN users u ON u.id = m.sender_id
            LEFT JOIN message_states s ON s.message_id = m.id AND s.user_id = $2
            WHERE m.id = $1`,
            [messageId, userId]
        )
        const msg = msgRows[0]
        if(!msg) return null

        const { rows: recipientRows } = await pool.query<RecipientRow>(
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
            is_read: msg.is_read ?? false,
            is_favorite: msg.is_favorite ?? false,
            recipients: recipientRows.map(r => ({
                type: r.type,
                id: r.id,
                name: r.name,
                accent_color: r.accent_color ?? null,
            } satisfies MessageRecipientResolved)),
        }
    }

    async setState(messageId: number, userId: number, dto: MessageStateUpdate): Promise<boolean> {
        const { rowCount } = await pool.query(
            `UPDATE message_states SET ${dto.field} = $3 WHERE message_id = $1 AND user_id = $2`,
            [messageId, userId, dto.value]
        )
        return (rowCount ?? 0) > 0
    }
}

export default new MessagesRepository()