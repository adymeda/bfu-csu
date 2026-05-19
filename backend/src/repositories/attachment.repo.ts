import type { PoolClient } from "pg"
import pool from "../db"
import { generateToken } from "../utils/token"
import type { Attachment, AttachmentPublic } from "../types/attachment"

export class AttachmentLinkError extends Error {
    constructor() {
        super("Invalid attachment id")
    }
}

interface CreateAttachmentDto {
    uploader_id: number
    original_name: string
    mime_type: string
    size_bytes: number
}

class AttachmentRepository {
    async create(dto: CreateAttachmentDto): Promise<Attachment> {
        const storage_name = generateToken()
        const { rows } = await pool.query<Attachment>(
            `INSERT INTO attachments (uploader_id, original_name, mime_type, size_bytes, storage_name)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, uploader_id, original_name, mime_type, size_bytes, storage_name, created_at`,
            [dto.uploader_id, dto.original_name, dto.mime_type, dto.size_bytes, storage_name]
        )
        return rows[0]!
    }

    async linkToMessage(client: PoolClient, ids: number[], uploaderId: number, messageId: number): Promise<void> {
        const { rows } = await client.query<{ id: number }>(
            `SELECT id FROM attachments WHERE id = ANY($1) AND uploader_id = $2`,
            [ids, uploaderId]
        )
        if(rows.length !== ids.length) throw new AttachmentLinkError()

        for(const id of ids) {
            await client.query(
                `INSERT INTO message_attachments (message_id, attachment_id) VALUES ($1, $2)`,
                [messageId, id]
            )
        }
    }

    async findByMessageId(messageId: number): Promise<AttachmentPublic[]> {
        const { rows } = await pool.query<AttachmentPublic>(
            `SELECT a.id, a.original_name, a.mime_type, a.size_bytes
            FROM attachments a
            JOIN message_attachments ma ON ma.attachment_id = a.id
            WHERE ma.message_id = $1
            ORDER BY a.id`,
            [messageId]
        )
        return rows
    }

    async copyAttachments(client: PoolClient, fromMessageId: number, toMessageId: number): Promise<void> {
        await client.query(
            `INSERT INTO message_attachments (message_id, attachment_id)
            SELECT $2, attachment_id FROM message_attachments WHERE message_id = $1`,
            [fromMessageId, toMessageId]
        )
    }

    async findById(id: number): Promise<Attachment | null> {
        const { rows } = await pool.query<Attachment>(
            `SELECT id, uploader_id, original_name, mime_type, size_bytes, storage_name, created_at
            FROM attachments WHERE id = $1`,
            [id]
        )
        return rows[0] ?? null
    }

    async userCanAccess(attachmentId: number, userId: number): Promise<boolean> {
        const { rows } = await pool.query<{ ok: boolean }>(
            `SELECT EXISTS(
                SELECT 1 FROM attachments a
                WHERE a.id = $1 AND (
                    a.uploader_id = $2
                    OR EXISTS(
                        SELECT 1 FROM message_attachments ma
                        JOIN messages m ON m.id = ma.message_id
                        WHERE ma.attachment_id = $1 AND (
                            m.sender_id = $2
                            OR EXISTS(SELECT 1 FROM message_states ms WHERE ms.message_id = m.id AND ms.user_id = $2)
                        )
                    )
                )
            ) AS ok`,
            [attachmentId, userId]
        )
        return rows[0]?.ok ?? false
    }
}

export default new AttachmentRepository()