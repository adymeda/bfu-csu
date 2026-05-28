import { apiFetch } from "./client"
import type { DeadlineResolved, CreateDeadlineDto } from "./types"

export function listDeadlines(from: string, to: string): Promise<DeadlineResolved[]> {
    const params = new URLSearchParams({ from, to })
    return apiFetch<DeadlineResolved[]>(`/deadlines?${params.toString()}`)
}

export function createDeadline(dto: CreateDeadlineDto): Promise<DeadlineResolved> {
    return apiFetch<DeadlineResolved>("/deadlines", {
        method: "POST",
        body: JSON.stringify(dto)
    })
}
