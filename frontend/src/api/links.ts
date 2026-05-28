import { apiFetch } from "./client"
import type { LinkPublic } from "./types"

// Telegram links are stored under link_type = 1 (the value is the chat id).
export const TELEGRAM_LINK_TYPE = 1

export function getLinks(): Promise<LinkPublic[]> {
    return apiFetch<LinkPublic[]>("/users/link")
}

export function linkTelegram(code: string): Promise<{ telegram_id: number }> {
    return apiFetch<{ telegram_id: number }>("/users/link/telegram", {
        method: "POST",
        body: JSON.stringify({ code })
    })
}

export function deleteLink(linkType: number): Promise<void> {
    return apiFetch<void>("/users/link", {
        method: "DELETE",
        body: JSON.stringify({ link_type: linkType })
    })
}
