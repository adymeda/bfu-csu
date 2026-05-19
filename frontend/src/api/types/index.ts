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