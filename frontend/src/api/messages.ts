import { apiFetch } from "./client"
import type { MessageListItem, MessageDetail, Message, SendMessageDto, RecipientInput } from "./types"

export interface ListMessagesParams {
    box?: "inbox" | "sent"
    limit?: number
    before?: number
    favorite?: boolean
    unread?: boolean
    category?: string
    requires_response?: boolean
    has_events?: boolean
    has_deadlines?: boolean
}

export function listMessages(params: ListMessagesParams): Promise<MessageListItem[]> {
    const q = new URLSearchParams()
    if(params.box) q.set("box", params.box)
    if(params.limit !== undefined) q.set("limit", String(params.limit))
    if(params.before !== undefined) q.set("before", String(params.before))
    if(params.favorite) q.set("favorite", "1")
    if(params.unread) q.set("unread", "1")
    if(params.category) q.set("category", params.category)
    if(params.requires_response) q.set("requires_response", "1")
    if(params.has_events) q.set("has_events", "1")
    if(params.has_deadlines) q.set("has_deadlines", "1")
    const qs = q.toString()
    return apiFetch<MessageListItem[]>(`/messages${qs ? `?${qs}` : ""}`)
}

export function getMessage(id: number): Promise<MessageDetail> {
    return apiFetch<MessageDetail>(`/messages/${id}`)
}

export function sendMessage(dto: SendMessageDto): Promise<Message> {
    return apiFetch<Message>("/messages", {
        method: "POST",
        body: JSON.stringify(dto)
    })
}

export function forwardMessage(id: number, recipients: RecipientInput[]): Promise<Message> {
    return apiFetch<Message>(`/messages/${id}/forward`, {
        method: "POST",
        body: JSON.stringify({ recipients })
    })
}

export function markRead(id: number): Promise<void> {
    return apiFetch<void>(`/messages/${id}/read`, { method: "POST" })
}

export function markUnread(id: number): Promise<void> {
    return apiFetch<void>(`/messages/${id}/read`, { method: "DELETE" })
}

export function addFavorite(id: number): Promise<void> {
    return apiFetch<void>(`/messages/${id}/favorite`, { method: "POST" })
}

export function removeFavorite(id: number): Promise<void> {
    return apiFetch<void>(`/messages/${id}/favorite`, { method: "DELETE" })
}

export function deleteMessage(id: number): Promise<void> {
    return apiFetch<void>(`/messages/${id}`, { method: "DELETE" })
}
