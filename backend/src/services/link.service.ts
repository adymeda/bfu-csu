import repo from "../repositories/link.repo"
import type { LinkPublic, CreateLinkDto } from "../types/link"

class LinksService {
    async getAll(userId: number): Promise<LinkPublic[]> {
        return repo.findByUser(userId)
    }

    async create(userId: number, dto: CreateLinkDto): Promise<LinkPublic> {
        return repo.create(userId, dto)
    }

    async delete(userId: number, linkType: number): Promise<boolean> {
        return repo.delete(userId, linkType)
    }
}

export default new LinksService()