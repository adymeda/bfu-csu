export interface Link {
    user_id: number
    link_type: number
    link_value: string
}

export interface LinkPublic {
    link_type: number
    link_value: string
}

export interface CreateLinkDto {
    link_type: number
    link_value: string
}
