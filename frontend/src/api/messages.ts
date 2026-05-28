import { apiFetch } from "./client"
import type { MessageListItem, MessageDetail, Message, SendMessageDto, RecipientInput } from "./types"

export interface ListMessagesParams {
    limit?: number
    before?: number
    favorite?: boolean
    unread?: boolean
}

export function listMessages(params: ListMessagesParams): Promise<MessageListItem[]> {
    const q = new URLSearchParams()
    if(params.limit !== undefined) q.set("limit", String(params.limit))
    if(params.before !== undefined) q.set("before", String(params.before))
    if(params.favorite) q.set("favorite", "1")
    if(params.unread) q.set("unread", "1")
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
