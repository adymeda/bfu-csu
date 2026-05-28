import { createContext, useContext, useEffect, useState } from "react"
import type { ReactNode } from "react"
import * as authApi from "../api/auth"
import type { User } from "../api/auth"
import { STORAGE_TOKEN_KEY, STORAGE_USER_KEY, UNAUTHORIZED_EVENT } from "../api/client"
import { queryClient } from "../api/queryClient"
import type { AuthStatus, AuthContextValue } from "./types"

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [status, setStatus] = useState<AuthStatus>("loading")
    const [user, setUser] = useState<User | null>(null)
    const [token, setToken] = useState<string | null>(null)

    useEffect(() => {
        const storedToken = localStorage.getItem(STORAGE_TOKEN_KEY)
        if (!storedToken) {
            setStatus("nouser")
            return
        }

        authApi.me(storedToken)
            .then((freshUser) => {
                setToken(storedToken)
                setUser(freshUser)
                localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(freshUser))
                setStatus("authed")
            })
            .catch(() => {
                localStorage.removeItem(STORAGE_TOKEN_KEY)
                localStorage.removeItem(STORAGE_USER_KEY)
                setStatus("nouser")
            })
    }, [])

    async function login(email: string, password: string, remember: boolean) {
        const result = await authApi.login(email, password, remember)
        localStorage.setItem(STORAGE_TOKEN_KEY, result.token)
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(result.user))
        setToken(result.token)
        setUser(result.user)
        setStatus("authed")
    }

    function clearSession() {
        setToken(null)
        setUser(null)
        setStatus("nouser")
        localStorage.removeItem(STORAGE_TOKEN_KEY)
        localStorage.removeItem(STORAGE_USER_KEY)
        queryClient.clear()
    }

    async function logout() {
        const current = token
        clearSession()
        if (current) {
            authApi.logout(current).catch(() => {})
        }
    }

    useEffect(() => {
        function onUnauthorized() {
            clearSession()
        }
        window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
        return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
    }, [])

    return (
        <AuthContext.Provider value={{ status, user, token, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error("useAuth must be used inside AuthProvider")
    return ctx
}