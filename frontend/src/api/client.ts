import type { ApiError } from "./types"

export const STORAGE_TOKEN_KEY = "auth_token"
export const STORAGE_USER_KEY = "auth_user"

// Fired when any authenticated request gets a 401. AuthContext listens for it
// and resets the session so the router sends the user back to /auth.
export const UNAUTHORIZED_EVENT = "auth:unauthorized"

export function getToken(): string | null {
    return localStorage.getItem(STORAGE_TOKEN_KEY)
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = getToken()
    const headers = new Headers(init.headers)

    if(token) headers.set("Authorization", `Bearer ${token}`)
    if(init.body !== undefined && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json")
    }

    const res = await fetch(`/api${path}`, { ...init, headers })

    if(res.status === 401) {
        window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
    }

    if(!res.ok) {
        const body = await res.json().catch(() => ({ error: "Unknown error" }))
        const err: ApiError = { status: res.status, message: body.error ?? "Unknown error" }
        throw err
    }

    if(res.status === 204) return undefined as T
    return res.json() as Promise<T>
}
