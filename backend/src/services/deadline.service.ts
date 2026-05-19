import repo from "../repositories/deadline.repo"
import type { DeadlineResolved, CreateDeadlineDto, UpdateDeadlineDto } from "../types/deadline"

const UPDATABLE_FIELDS = ["title", "assignee_id", "due_at", "message_id"] as const

class DeadlinesService {
    async findById(id: number): Promise<DeadlineResolved | null> {
        return repo.findById(id)
    }

    async findByUser(userId: number, from: string | null, to: string | null): Promise<DeadlineResolved[]> {
        return repo.findByUser(userId, from, to)
    }

    async create(dto: CreateDeadlineDto, createdBy: number): Promise<DeadlineResolved> {
        return repo.create(dto, createdBy)
    }

    async update(id: number, body: Record<string, unknown>): Promise<DeadlineResolved | null> {
        const data: UpdateDeadlineDto = {}
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

export default new DeadlinesService()