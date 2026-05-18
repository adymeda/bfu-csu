export interface User {
    id: number
    email: string
    display_name: string
    accent_color: string
    created_at: Date
    last_login_at: Date
}

export interface UserPublic {
    id: number
    display_name: string
    accent_color: string
}

export interface CreateUserDto {
    email: string
    password: string
    display_name: string
}

export type UpdateUserDto = Partial<{
    email: string
    password: string
    display_name: string
    accent_color: string
}>