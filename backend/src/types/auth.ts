import type { User } from "./user"

export interface Session {
    token: string
    user_id: number
    expires_at: Date
    created_at: Date
}

export interface LoginDto {
    email: string
    password: string
    remember?: boolean
}

export interface RegisterDto {
    email: string
    password: string
    display_name: string
    remember?: boolean
}

export interface AuthResponse {
    token: string
    user: User
}