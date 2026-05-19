import repo from "../repositories/event.repo"
import type { EventResolved, CreateEventDto, UpdateEventDto } from "../types/event"

const UPDATABLE_FIELDS = ["title", "assignee_id", "start_at", "end_at", "message_id"] as const

class EventsService {
    async findById(id: number): Promise<EventResolved | null> {
        return repo.findById(id)
    }

    async findByUser(userId: number, from: string | null, to: string | null): Promise<EventResolved[]> {
        return repo.findByUser(userId, from, to)
    }

    async create(dto: CreateEventDto, createdBy: number): Promise<EventResolved> {
        return repo.create(dto, createdBy)
    }

    async update(id: number, body: Record<string, unknown>): Promise<EventResolved | null> {
        const data: UpdateEventDto = {}
        for (const field of UPDATABLE_FIELDS) {
            if(field in body) (data as Record<string, unknown>)[field] = body[field]
        }
        if(Object.keys(data).length === 0) return null
        return repo.update(id, data)
    }

    async delete(id: number): Promise<boolean> {
        return repo.delete(id)
    }
}

export default new EventsService()