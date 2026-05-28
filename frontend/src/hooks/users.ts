import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query"
import { listUsers, getUser, updateUser } from "../api/users"
import type { ListUsersParams, UpdateUserData } from "../api/users"

export function useUsers(params: ListUsersParams = {}) {
    return useQuery({
        queryKey: ["users", params],
        queryFn: () => listUsers(params),
        placeholderData: keepPreviousData
    })
}

export function useUser(id: number | null) {
    return useQuery({
        queryKey: ["user", id],
        queryFn: () => getUser(id!),
        enabled: id !== null
    })
}

export function useUpdateUser() {
    return useMutation({
        mutationFn: ({ id, data }: { id: number, data: UpdateUserData }) => updateUser(id, data)
    })
}
