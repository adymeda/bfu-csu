import type { UserPublic } from "./user"

export interface Deadline {
    id: number
    title: string
    created_by: number
    assignee_id: number
    message_id: number | null
    due_at: Date
    created_at: Date
}

export interface DeadlineResolved {
    id: number
    title: string
    created_by: UserPublic
    assignee: UserPublic
    message_id: number | null
    due_at: Date
    created_at: Date
}

export interface CreateDeadlineDto {
    title: string
    assignee_id: number
    due_at: string
    message_id?: number | null
}

export type UpdateDeadlineDto = Partial<{
    title: string
    assignee_id: number
    due_at: string
    message_id: number | null
}>