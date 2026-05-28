import { apiFetch } from "./client"
import type { GroupPublic, GroupMember, GroupAdmin } from "./types"

export function searchGroups(q: string): Promise<GroupPublic[]> {
    return apiFetch<GroupPublic[]>(`/groups/search?q=${encodeURIComponent(q)}`)
}

export function getRootGroups(): Promise<GroupPublic[]> {
    return apiFetch<GroupPublic[]>("/groups/roots")
}

export function getSuggestedGroups(): Promise<GroupPublic[]> {
    return apiFetch<GroupPublic[]>("/groups/suggested")
}

export function getGroup(id: number): Promise<GroupPublic> {
    return apiFetch<GroupPublic>(`/groups/${id}`)
}

export function getGroupChildren(id: number): Promise<GroupPublic[]> {
    return apiFetch<GroupPublic[]>(`/groups/${id}/children`)
}

export function createGroup(name: string, parent_id: number | null): Promise<GroupPublic> {
    return apiFetch<GroupPublic>("/groups", {
        method: "POST",
        body: JSON.stringify({ name, parent_id })
    })
}

export function updateGroup(id: number, data: { name?: string, parent_id?: number | null }): Promise<GroupPublic> {
    return apiFetch<GroupPublic>(`/groups/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data)
    })
}

export function deleteGroup(id: number): Promise<void> {
    return apiFetch<void>(`/groups/${id}`, { method: "DELETE" })
}

export function getGroupMembers(id: number, deep = false): Promise<GroupMember[]> {
    return apiFetch<GroupMember[]>(`/groups/${id}/members${deep ? "?deep=1" : ""}`)
}

export function addGroupMember(id: number, userId: number): Promise<void> {
    return apiFetch<void>(`/groups/${id}/members`, {
        method: "POST",
        body: JSON.stringify({ user_id: userId })
    })
}

export function removeGroupMember(id: number, userId: number): Promise<void> {
    return apiFetch<void>(`/groups/${id}/members/${userId}`, { method: "DELETE" })
}

export function getGroupAdmins(id: number): Promise<GroupAdmin[]> {
    return apiFetch<GroupAdmin[]>(`/groups/${id}/admins`)
}

export function addGroupAdmin(id: number, userId: number, isSuper = false): Promise<void> {
    return apiFetch<void>(`/groups/${id}/admins`, {
        method: "POST",
        body: JSON.stringify({ user_id: userId, is_super: isSuper })
    })
}

export function removeGroupAdmin(id: number, userId: number): Promise<void> {
    return apiFetch<void>(`/groups/${id}/admins/${userId}`, { method: "DELETE" })
}
