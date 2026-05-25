import type { RecipientInput } from "../types/message"
import { RECIPIENT_TYPE } from "../types/message"

export function validateRecipients(recipients: unknown): recipients is RecipientInput[] {
    if(!Array.isArray(recipients) || recipients.length === 0) return false
    for (const r of recipients) {
        if(typeof r !== "object" || r === null) return false
        const rec = r as Record<string, unknown>
        if(!Number.isInteger(rec["type"])) return false
        if(!Number.isInteger(rec["id"])) return false
        if(rec["type"] !== RECIPIENT_TYPE.USER && rec["type"] !== RECIPIENT_TYPE.GROUP) return false
    }
    return true
}