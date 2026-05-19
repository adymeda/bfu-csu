import type { User } from "../../api/types"

export type AuthStatus = "loading" | "authed" | "nouser"

export interface AuthContextValue {
    status: AuthStatus
    user: User | null
    token: string | null
    login: (email: string, password: string, remember: boolean) => Promise<void>
    logout: () => Promise<void>
}