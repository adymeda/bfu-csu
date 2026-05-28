import repo from "../repositories/group.repo"
import type { GroupPublic, GroupMember, GroupAdmin, CreateGroupDto, UpdateGroupDto } from "../types/group"

const UPDATABLE_FIELDS = ["name", "parent_id"] as const

class GroupsService {
    async findById(id: number): Promise<GroupPublic | null> {
        return repo.findById(id)
    }

    async create(dto: CreateGroupDto): Promise<GroupPublic> {
        return repo.create(dto)
    }

    async update(id: number, body: Record<string, unknown>): Promise<GroupPublic | null> {
        const data: UpdateGroupDto = {}
        for (const field of UPDATABLE_FIELDS) {
            if(field in body) (data as Record<string, unknown>)[field] = body[field]
        }
        if(Object.keys(data).length === 0) return null
        return repo.update(id, data)
    }

    async delete(id: number): Promise<boolean> {
        return repo.delete(id)
    }

    async findChildren(groupId: number): Promise<GroupPublic[]> {
        return repo.findChildren(groupId)
    }

    async findAncestors(groupId: number): Promise<GroupPublic[]> {
        return repo.findAncestors(groupId)
    }

    async isVisible(userId: number, groupId: number): Promise<boolean> {
        return repo.isVisible(userId, groupId)
    }

    async isAdmin(userId: number, groupId: number): Promise<boolean> {
        return repo.isAdminOfOrAncestor(userId, groupId)
    }

    async isSuperAdmin(userId: number, groupId: number): Promise<boolean> {
        return repo.isSuperAdminOfOrAncestor(userId, groupId)
    }

    async findMembers(groupId: number, deep: boolean): Promise<GroupMember[]> {
        return repo.findMembers(groupId, deep)
    }

    async addMember(groupId: number, userId: number): Promise<void> {
        return repo.addMember(groupId, userId)
    }

    async removeMember(groupId: number, userId: number): Promise<boolean> {
        return repo.removeMember(groupId, userId)
    }

    async findAdmins(groupId: number): Promise<GroupAdmin[]> {
        return repo.findAdmins(groupId)
    }

    async addAdmin(groupId: number, userId: number, isSuper: boolean): Promise<void> {
        return repo.addAdmin(groupId, userId, isSuper)
    }

    async removeAdmin(groupId: number, userId: number): Promise<boolean> {
        return repo.removeAdmin(groupId, userId)
    }

    async canAssign(authorId: number, assigneeId: number): Promise<boolean> {
        return repo.canAssign(authorId, assigneeId)
    }

    async search(userId: number, q: string): Promise<GroupPublic[]> {
        return repo.search(userId, q)
    }

    async suggested(userId: number): Promise<GroupPublic[]> {
        return repo.suggested(userId)
    }

    async roots(userId: number): Promise<GroupPublic[]> {
        return repo.findRoots(userId)
    }
}

export default new GroupsService()