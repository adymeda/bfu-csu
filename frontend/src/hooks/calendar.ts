import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { listEvents, createEvent } from "../api/events"
import { listDeadlines, createDeadline } from "../api/deadlines"
import type { CreateEventDto, CreateDeadlineDto } from "../api/types"

export function useEvents(from: string, to: string) {
    return useQuery({
        queryKey: ["events", { from, to }],
        queryFn: () => listEvents(from, to)
    })
}

export function useDeadlines(from: string, to: string) {
    return useQuery({
        queryKey: ["deadlines", { from, to }],
        queryFn: () => listDeadlines(from, to)
    })
}

export function useCreateEvent() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (dto: CreateEventDto) => createEvent(dto),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["events"] })
    })
}

export function useCreateDeadline() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (dto: CreateDeadlineDto) => createDeadline(dto),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["deadlines"] })
    })
}
