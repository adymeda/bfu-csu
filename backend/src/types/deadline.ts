import type { UserPublic } from "./user"
import type { RecipientInput } from "./message"

export interface Deadline {
    id: number
    title: string
    created_by: number
    message_id: number | null
    due_at: Date
    created_at: Date
}

export interface DeadlineResolved {
    id: number
    title: string
    created_by: UserPublic
    participants: UserPublic[]
    message_id: number | null
    due_at: Date
    created_at: Date
}

export interface CreateDeadlineDto {
    title: string
    recipients: RecipientInput[]
    due_at: string
    message_id?: number | null
}

export type UpdateDeadlineDto = Partial<{
    title: string
    due_at: string
    message_id: number | null
}>

export interface DeadlineRow {
    id: number
    title: string
    message_id: number | null
    due_at: Date
    created_at: Date
    cb_id: number
    cb_name: string
    cb_color: string
}

export interface DeadlineParticipantRow {
    deadline_id: number
    p_id: number
    p_name: string
    p_color: string
}