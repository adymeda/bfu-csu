import { apiFetch } from "./client"
import type { EventResolved, CreateEventDto } from "./types"

export function listEvents(from: string, to: string): Promise<EventResolved[]> {
    const params = new URLSearchParams({ from, to })
    return apiFetch<EventResolved[]>(`/events?${params.toString()}`)
}

export function createEvent(dto: CreateEventDto): Promise<EventResolved> {
    return apiFetch<EventResolved>("/events", {
        method: "POST",
        body: JSON.stringify(dto)
    })
}
