import { apiFetch } from "./client"
import type { UserListResponse, UserPublic, User } from "./types"

export interface UpdateUserData {
    email?: string
    password?: string
    display_name?: string
    accent_color?: string
}

export function updateUser(id: number, data: UpdateUserData): Promise<User> {
    return apiFetch<User>(`/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data)
    })
}

export interface ListUsersParams {
    q?: string
    limit?: number
    offset?: number
}

export function listUsers(params: ListUsersParams = {}): Promise<UserListResponse> {
    const q = new URLSearchParams()
    if(params.q) q.set("q", params.q)
    if(params.limit !== undefined) q.set("limit", String(params.limit))
    if(params.offset !== undefined) q.set("offset", String(params.offset))
    const qs = q.toString()
    return apiFetch<UserListResponse>(`/users${qs ? `?${qs}` : ""}`)
}

export function getUser(id: number): Promise<UserPublic> {
    return apiFetch<UserPublic>(`/users/${id}`)
}
