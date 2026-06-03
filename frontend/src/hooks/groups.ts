import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
    searchGroups, getSuggestedGroups, getRootGroups, getGroup, getGroupChildren,
    createGroup, updateGroup, deleteGroup,
    getGroupMembers, addGroupMember, removeGroupMember,
    getGroupAdmins, addGroupAdmin, removeGroupAdmin,
    addGroupAlias, removeGroupAlias, setGroupRole
} from "../api/groups"
import type { GroupPublic } from "../api/types"
import type { TreeNode } from "@components/ui/types"

export interface GroupTree {
    tree: TreeNode[]
    groups: GroupPublic[]
}

async function loadGroupTree(): Promise<GroupTree> {
    const flat: GroupPublic[] = []
    async function build(group: GroupPublic): Promise<TreeNode> {
        flat.push(group)
        const children = await getGroupChildren(group.id)
        return {
            id: group.id,
            label: group.name,
            children: await Promise.all(children.map(build))
        }
    }
    const roots = await getRootGroups()
    const tree = await Promise.all(roots.map(build))
    return { tree, groups: flat }
}

export function useGroupTree() {
    return useQuery({
        queryKey: ["groups", "tree"],
        queryFn: loadGroupTree
    })
}

export function useSearchGroups(q: string) {
    return useQuery({
        queryKey: ["groups", "search", q],
        queryFn: () => searchGroups(q),
        enabled: q.trim().length > 0
    })
}

export function useSuggestedGroups() {
    return useQuery({
        queryKey: ["groups", "suggested"],
        queryFn: getSuggestedGroups
    })
}

export function useGroup(id: number | null) {
    return useQuery({
        queryKey: ["group", id],
        queryFn: () => getGroup(id!),
        enabled: id !== null
    })
}

export function useGroupChildren(id: number | null) {
    return useQuery({
        queryKey: ["group", id, "children"],
        queryFn: () => getGroupChildren(id!),
        enabled: id !== null
    })
}

export function useGroupMembers(id: number | null) {
    return useQuery({
        queryKey: ["group", id, "members"],
        queryFn: () => getGroupMembers(id!),
        enabled: id !== null
    })
}

export function useGroupAdmins(id: number | null) {
    return useQuery({
        queryKey: ["group", id, "admins"],
        queryFn: () => getGroupAdmins(id!),
        enabled: id !== null
    })
}

export function useCreateGroup() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ name, parentId }: { name: string, parentId: number | null }) =>
            createGroup(name, parentId),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["groups"] })
    })
}

export function useUpdateGroup() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ id, data }: { id: number, data: { name?: string, parent_id?: number | null } }) =>
            updateGroup(id, data),
        onSuccess: (_d, { id }) => {
            qc.invalidateQueries({ queryKey: ["groups"] })
            qc.invalidateQueries({ queryKey: ["group", id] })
        }
    })
}

export function useDeleteGroup() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (id: number) => deleteGroup(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["groups"] })
    })
}

export function useAddGroupMember() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ groupId, userId }: { groupId: number, userId: number }) =>
            addGroupMember(groupId, userId),
        onSuccess: (_d, { groupId }) => qc.invalidateQueries({ queryKey: ["group", groupId, "members"] })
    })
}

export function useRemoveGroupMember() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ groupId, userId }: { groupId: number, userId: number }) =>
            removeGroupMember(groupId, userId),
        onSuccess: (_d, { groupId, userId }) => {
            qc.invalidateQueries({ queryKey: ["group", groupId, "members"] })
            qc.invalidateQueries({ queryKey: ["user", userId, "groups"] })
        }
    })
}

export function useAddGroupAdmin() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ groupId, userId, isSuper }: { groupId: number, userId: number, isSuper?: boolean }) =>
            addGroupAdmin(groupId, userId, isSuper),
        onSuccess: (_d, { groupId }) => qc.invalidateQueries({ queryKey: ["group", groupId, "admins"] })
    })
}

export function useRemoveGroupAdmin() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ groupId, userId }: { groupId: number, userId: number }) =>
            removeGroupAdmin(groupId, userId),
        onSuccess: (_d, { groupId }) => qc.invalidateQueries({ queryKey: ["group", groupId, "admins"] })
    })
}

export function useAddGroupAlias() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ groupId, alias }: { groupId: number, alias: string }) =>
            addGroupAlias(groupId, alias),
        onSuccess: (_d, { groupId }) => qc.invalidateQueries({ queryKey: ["group", groupId] })
    })
}

export function useRemoveGroupAlias() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ groupId, alias }: { groupId: number, alias: string }) =>
            removeGroupAlias(groupId, alias),
        onSuccess: (_d, { groupId }) => qc.invalidateQueries({ queryKey: ["group", groupId] })
    })
}

export function useSetGroupRole() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ groupId, userId, position }: { groupId: number, userId: number, position: string }) =>
            setGroupRole(groupId, userId, position),
        onSuccess: (_d, { groupId }) => qc.invalidateQueries({ queryKey: ["group", groupId, "members"] })
    })
}
