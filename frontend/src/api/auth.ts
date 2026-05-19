import type { User, AuthResponse, ApiError } from "./types"
export type { User, AuthResponse, ApiError }

async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(path, init)
    if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Unknown error" }))
        const err: ApiError = { status: res.status, message: body.error ?? "Unknown error" }
        throw err
    }
    if (res.status === 204) return undefined as T
    return res.json() as Promise<T>
}

export function login(email: string, password: string, remember: boolean): Promise<AuthResponse> {
    return request<AuthResponse>("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, remember })
    })
}

export function logout(token: string): Promise<void> {
    return request<void>("/api/auth/logout", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
    })
}

export function me(token: string): Promise<User> {
    return request<User>("/api/auth/me", {
        headers: { "Authorization": `Bearer ${token}` }
    })
}