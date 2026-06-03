export interface User {
    id: number
    email: string
    display_name: string
    accent_color: string
    created_at: string
    last_login_at: string
}

export interface AuthResponse {
    token: string
    user: User
}

export interface ApiError {
    status: number
    message: string
}

export interface UserPublic {
    id: number
    display_name: string
    accent_color: string
}

export interface UserListResponse {
    items: UserPublic[]
    total: number
    limit: number
    offset: number
}

export interface LinkPublic {
    link_type: number
    link_value: string
}



export interface EventResolved {
    id: number
    title: string
    message_id: number | null
    start_at: string
    end_at: string | null
    created_at: string
    created_by: UserPublic
    assignee: UserPublic
}

export interface DeadlineResolved {
    id: number
    title: string
    message_id: number | null
    due_at: string
    created_at: string
    created_by: UserPublic
    assignee: UserPublic
}

export interface CreateEventDto {
    title: string
    assignee_id: number
    start_at: string
    end_at?: string | null
    message_id?: number | null
}

export interface CreateDeadlineDto {
    title: string
    assignee_id: number
    due_at: string
    message_id?: number | null
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
    created_at: string
}

export interface MessageRecipientResolved {
    type: 0 | 1
    id: number
    name: string
    accent_color: string | null
}

export interface AttachmentPublic {
    id: number
    original_name: string
    mime_type: string
    size_bytes: number
}

export interface MessageDetail extends MessageListItem {
    recipients: MessageRecipientResolved[]
    events: EventResolved[]
    deadlines: DeadlineResolved[]
    attachments: AttachmentPublic[]
}

export interface RecipientInput {
    type: 0 | 1
    id: number
}


export interface MessageEventInput {
    title: string
    start_at: string
    end_at?: string | null
}

export interface MessageDeadlineInput {
    title: string
    due_at: string
}

export interface SendMessageDto {
    title: string
    content: string
    reply_to?: number | null
    recipients: RecipientInput[]
    events?: MessageEventInput[]
    deadlines?: MessageDeadlineInput[]
    attachments?: number[]
}

export interface Message {
    id: number
    sender_id: number
    title: string
    content: string
    reply_to: number | null
    forwarded_from: number | null
    created_at: string
}


export interface GroupPublic {
    id: number
    name: string
    parent_id: number | null
}

export interface GroupDetail extends GroupPublic {
    aliases: string[]
}

export interface GroupMember {
    id: number
    display_name: string
    accent_color: string
    position: string | null
}

export interface GroupAdmin {
    user_id: number
    is_super: boolean
    display_name: string
    accent_color: string
}

export interface ComposeResult {
    subject: string
    body: string
    recipients: MessageRecipientResolved[]
    warnings: string[]
}

export interface ExtractEventResult {
    is_deadline: boolean
    title: string | null
    start_at: string | null
    end_at: string | null
}

export interface SummarizeResult {
    summary: string
}