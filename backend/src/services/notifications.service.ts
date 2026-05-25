import pool from "../db"
import type { RecipientInput } from "../types/message"
import { RECIPIENT_TYPE } from "../types/message"
import telegramService from "./telegram.service"

interface DispatchPayload {
    sender: { id: number, display_name: string }
    title: string
    content: string
    recipients: RecipientInput[]
}

class NotificationsService {
    private async resolveUserIds(recipients: RecipientInput[], excludeId: number): Promise<number[]> {
        const directUserIds = recipients.filter(r => r.type === RECIPIENT_TYPE.USER).map(r => r.id)
        const groupIds = recipients.filter(r => r.type === RECIPIENT_TYPE.GROUP).map(r => r.id)

        let memberIds: number[] = []
        if(groupIds.length > 0) {
            const { rows } = await pool.query<{ user_id: number }>(
                `SELECT DISTINCT user_id FROM group_members WHERE group_id = ANY($1)`,
                [groupIds]
            )
            memberIds = rows.map(r => r.user_id)
        }

        const all = [...new Set([...directUserIds, ...memberIds])]
        return all.filter(id => id !== excludeId)
    }

    async dispatchMessage(payload: DispatchPayload): Promise<void> {
        try {
            const userIds = await this.resolveUserIds(payload.recipients, payload.sender.id)
            if(userIds.length === 0) return

            const text = `${payload.sender.display_name}\n${payload.title}\n\n${payload.content}`

            const result = await telegramService.notify(userIds, text)
            if(result) {
                console.info(`[notify] telegram: sent=${result.sent} failed=${result.failed} missing=${result.missing_users.length}`)
            }
        } catch (err) {
            console.warn("[notify] dispatchMessage error:", (err as Error).message)
        }
    }
}

export default new NotificationsService()