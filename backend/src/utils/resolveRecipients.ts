import type { PoolClient } from "pg"
import type { RecipientInput } from "../types/message"
import { RECIPIENT_TYPE } from "../types/message"

export async function resolveRecipientUserIds(client: PoolClient, recipients: RecipientInput[]): Promise<number[]> {
    const directUserIds = recipients.filter(r => r.type === RECIPIENT_TYPE.USER).map(r => r.id)
    const groupIds = recipients.filter(r => r.type === RECIPIENT_TYPE.GROUP).map(r => r.id)

    let memberIds: number[] = []
    if(groupIds.length > 0) {
        const { rows } = await client.query<{ user_id: number }>(
            `SELECT DISTINCT user_id FROM group_members WHERE group_id = ANY($1)`,
            [groupIds]
        )
        memberIds = rows.map(r => r.user_id)
    }

    return [...new Set([...directUserIds, ...memberIds])]
}