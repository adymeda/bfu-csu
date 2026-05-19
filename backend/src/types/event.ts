import type { UserPublic } from "./user"

export interface Event {
    id: number
    title: string
    created_by: number
    assignee_id: number
    message_id: number | null
    start_at: Date
    end_at: Date | null
    created_at: Date
}

export interface EventResolved {
    id: number
    title: string
    created_by: UserPublic
    assignee: UserPublic
    message_id: number | null
    start_at: Date
    end_at: Date | null
    created_at: Date
}

export interface CreateEventDto {
    title: string
    assignee_id: number
    start_at: string
    end_at?: string | null
    message_id?: number | null
}

export type UpdateEventDto = Partial<{
    title: string
    assignee_id: number
    start_at: string
    end_at: string | null
    message_id: number | null
}>