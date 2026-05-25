import repo from "../repositories/deadline.repo"
import type { DeadlineResolved, CreateDeadlineDto, UpdateDeadlineDto } from "../types/deadline"
import type { RecipientInput } from "../types/message"

const UPDATABLE_FIELDS = ["title", "due_at", "message_id"] as const

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
        const recipients = "recipients" in body ? (body["recipients"] as RecipientInput[]) : undefined
        if(Object.keys(data).length === 0 && recipients === undefined) return null
        return repo.update(id, data, recipients)
    }

    async delete(id: number): Promise<boolean> {
        return repo.delete(id)
    }
}

export default new DeadlinesService()