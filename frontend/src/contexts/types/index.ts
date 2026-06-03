import type { User } from "../../api/types"

export type AuthStatus = "loading" | "authed" | "nouser"

export interface AuthContextValue {
    status: AuthStatus
    user: User | null
    token: string | null
    login: (email: string, password: string, remember: boolean) => Promise<void>
    logout: () => Promise<void>
}

export type ToastType = "success" | "error" | "info" | "warning"

export interface Toast {
    id: string
    type: ToastType
    message: string
}

export interface ToastContextValue {
    success: (message: string) => void
    error: (message: string) => void
    info: (message: string) => void
    warning: (message: string) => void
}