export interface Group {
    id: number
    name: string
    parent_id: number | null
    created_at: Date
}

export interface GroupPublic {
    id: number
    name: string
    parent_id: number | null
}

export interface GroupMember {
    id: number
    display_name: string
    accent_color: string
}

export interface GroupAdmin {
    user_id: number
    is_super: boolean
    display_name: string
    accent_color: string
}

export interface CreateGroupDto {
    name: string
    parent_id?: number | null
}

export interface AddAdminDto {
    user_id: number
    is_super?: boolean
}

export type UpdateGroupDto = Partial<{ name: string; parent_id: number | null }>