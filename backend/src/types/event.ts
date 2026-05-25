import type { UserPublic } from "./user"
import type { RecipientInput } from "./message"

export interface Event {
    id: number
    title: string
    created_by: number
    message_id: number | null
    start_at: Date
    end_at: Date | null
    created_at: Date
}

export interface EventResolved {
    id: number
    title: string
    created_by: UserPublic
    participants: UserPublic[]
    message_id: number | null
    start_at: Date
    end_at: Date | null
    created_at: Date
}

export interface CreateEventDto {
    title: string
    recipients: RecipientInput[]
    start_at: string
    end_at?: string | null
    message_id?: number | null
}

export type UpdateEventDto = Partial<{
    title: string
    start_at: string
    end_at: string | null
    message_id: number | null
}>

export interface EventRow {
    id: number
    title: string
    message_id: number | null
    start_at: Date
    end_at: Date | null
    created_at: Date
    cb_id: number
    cb_name: string
    cb_color: string
}

export interface EventParticipantRow {
    event_id: number
    p_id: number
    p_name: string
    p_color: string
}