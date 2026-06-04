import type { UserPublic } from "./user"
import type { EventResolved, CreateEventDto } from "./event"
import type { DeadlineResolved, CreateDeadlineDto } from "./deadline"
import type { AttachmentPublic } from "./attachment"

export type { EventResolved, DeadlineResolved }

export const RECIPIENT_TYPE = {
    USER: 0,
    GROUP: 1,
} as const

export const MESSAGE_CATEGORY = {
    STUDY: "учебное",
    ORG: "организационное",
    PERSONAL: "личное",
    ANNOUNCEMENT: "объявление",
} as const

export const MESSAGE_CATEGORIES: ReadonlySet<string> = new Set(Object.values(MESSAGE_CATEGORY))

export interface Message {
    id: number
    sender_id: number
    title: string
    content: string
    reply_to: number | null
    forwarded_from: number | null
    created_at: Date
}

export interface RecipientInput {
    type: number
    id: number
}

export interface MessageRecipientRow {
    message_id: number
    recipient_type: number
    recipient_id: number
}

export interface MessageStateRow {
    message_id: number
    user_id: number
    is_read: boolean
    is_favorite: boolean
    is_deleted: boolean
    created_at: Date
}

export interface CreateMessageDto {
    title: string
    content: string
    reply_to: number | null
    recipients: RecipientInput[]
    events?: CreateEventDto[]
    deadlines?: CreateDeadlineDto[]
    attachments?: number[]
}

export interface ForwardMessageDto {
    recipients: RecipientInput[]
}

export interface MessageListQuery {
    box: "inbox" | "sent"
    limit: number
    before: number | null
    favorite: boolean
    unread: boolean
    category: string | null
    requires_response: boolean
    has_events: boolean
    has_deadlines: boolean
}

export interface MessageTag {
    message_id: number
    category: string | null
    requires_response: boolean | null
    updated_at: Date
}

export interface MessageStateUpdate {
    field: "is_read" | "is_favorite" | "is_deleted"
    value: boolean
}

export interface MessageListItem {
    id: number
    title: string
    content: string
    sender: UserPublic
    reply_to: number | null
    forwarded_from: number | null
    is_read: boolean
    is_favorite: boolean
    created_at: Date
    category: string | null
    requires_response: boolean | null
}

export interface MessageRecipientResolved {
    type: number
    id: number
    name: string
    accent_color: string | null
}

export interface MessageDetail extends MessageListItem {
    recipients: MessageRecipientResolved[]
    events: EventResolved[]
    deadlines: DeadlineResolved[]
    attachments: AttachmentPublic[]
}

export interface MessageListRow {
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
    category: string | null
    requires_response: boolean | null
}

export interface RecipientJoinRow {
    type: number
    id: number
    name: string
    accent_color: string | null
}