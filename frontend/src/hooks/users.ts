import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { listUsers, getUser, updateUser, createUser, deleteUser, getUserGroups } from "../api/users"
import type { ListUsersParams, UpdateUserData, CreateUserData, UserGroupPublic } from "../api/users"

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

export function useUserGroups(id: number | null) {
	return useQuery<UserGroupPublic[]>({
		queryKey: ["user", id, "groups"],
		queryFn: () => getUserGroups(id!),
		enabled: id !== null
	})
}

export function useUpdateUser() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: ({ id, data }: { id: number, data: UpdateUserData }) => updateUser(id, data),
		onSuccess: (_d, { id }) => {
			qc.invalidateQueries({ queryKey: ["users"] })
			qc.invalidateQueries({ queryKey: ["user", id] })
		}
	})
}

export function useCreateUser() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (data: CreateUserData) => createUser(data),
		onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] })
	})
}

export function useDeleteUser() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: (id: number) => deleteUser(id),
		onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] })
	})
}
