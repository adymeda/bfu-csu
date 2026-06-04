import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
    listMessages, getMessage, sendMessage, forwardMessage,
    markRead, markUnread, addFavorite, removeFavorite, deleteMessage
} from "../api/messages"
import type { SendMessageDto, RecipientInput } from "../api/types"

const PAGE_SIZE = 20

export interface MessagesFilter {
    box?: "inbox" | "sent"
    favorite?: boolean
    unread?: boolean
    category?: string
    requires_response?: boolean
    has_events?: boolean
    has_deadlines?: boolean
}

export function useMessages(filter: MessagesFilter, enabled = true) {
    return useInfiniteQuery({
        queryKey: ["messages", filter],
        queryFn: ({ pageParam }) => listMessages({
            ...filter,
            limit: PAGE_SIZE,
            ...(pageParam !== undefined && { before: pageParam })
        }),
        initialPageParam: undefined as number | undefined,
        getNextPageParam: (lastPage) =>
            lastPage.length === PAGE_SIZE ? lastPage[lastPage.length - 1]!.id : undefined,
        enabled
    })
}

export function useMessage(id: number | null) {
    return useQuery({
        queryKey: ["message", id],
        queryFn: () => getMessage(id!),
        enabled: id !== null
    })
}

function invalidateMessages(qc: ReturnType<typeof useQueryClient>) {
    qc.invalidateQueries({ queryKey: ["messages"] })
}

export function useSendMessage() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (dto: SendMessageDto) => sendMessage(dto),
        onSuccess: () => {
            invalidateMessages(qc)
            qc.invalidateQueries({ queryKey: ["events"] })
            qc.invalidateQueries({ queryKey: ["deadlines"] })
        }
    })
}

export function useForwardMessage() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ id, recipients }: { id: number, recipients: RecipientInput[] }) =>
            forwardMessage(id, recipients),
        onSuccess: () => invalidateMessages(qc)
    })
}

export function useMarkRead() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ id, read }: { id: number, read: boolean }) =>
            read ? markRead(id) : markUnread(id),
        onSuccess: (_data, { id }) => {
            invalidateMessages(qc)
            qc.invalidateQueries({ queryKey: ["message", id] })
        }
    })
}

export function useToggleFavorite() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ id, favorite }: { id: number, favorite: boolean }) =>
            favorite ? addFavorite(id) : removeFavorite(id),
        onSuccess: (_data, { id }) => {
            invalidateMessages(qc)
            qc.invalidateQueries({ queryKey: ["message", id] })
        }
    })
}

export function useDeleteMessage() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (id: number) => deleteMessage(id),
        onSuccess: () => invalidateMessages(qc)
    })
}
