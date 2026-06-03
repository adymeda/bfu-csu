import { apiFetch } from "./client"
import type { UserListResponse, UserPublic, User, GroupPublic } from "./types"

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

export interface CreateUserData {
    email: string
    password: string
    display_name: string
}

export function createUser(data: CreateUserData): Promise<User> {
    return apiFetch<User>("/users", {
        method: "POST",
        body: JSON.stringify(data)
    })
}

export function deleteUser(id: number): Promise<void> {
    return apiFetch<void>(`/users/${id}`, { method: "DELETE" })
}

export interface UserGroupPublic extends GroupPublic {
    position: string | null
}

export function getUserGroups(id: number): Promise<UserGroupPublic[]> {
    return apiFetch<UserGroupPublic[]>(`/users/${id}/groups`)
}
