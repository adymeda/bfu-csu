import repo from "../repositories/message.repo"
import mlService from "./ml.service"
import type { Message, MessageListItem, MessageDetail, CreateMessageDto, RecipientInput, MessageListQuery, MessageStateUpdate } from "../types/message"
import { MESSAGE_CATEGORIES } from "../types/message"

class MessagesService {
    async create(dto: CreateMessageDto, senderId: number): Promise<Message> {
        return repo.createMessage(
            {
                sender_id: senderId,
                title: dto.title,
                content: dto.content,
                reply_to: dto.reply_to,
                forwarded_from: null,
            },
            dto.recipients,
            dto.events ?? [],
            dto.deadlines ?? [],
            dto.attachments ?? []
        )
    }

    async hasAccess(messageId: number, userId: number): Promise<boolean> {
        return repo.hasAccess(messageId, userId)
    }

    async findList(userId: number, query: MessageListQuery): Promise<MessageListItem[]> {
        return repo.findListByUser(userId, query)
    }

    async findDetail(messageId: number, userId: number): Promise<MessageDetail | null> {
        const ok = await repo.hasAccess(messageId, userId)
        if(!ok) return null
        return repo.findDetailById(messageId, userId)
    }

    async setState(messageId: number, userId: number, dto: MessageStateUpdate): Promise<boolean> {
        return repo.setState(messageId, userId, dto)
    }

    async categorize(messageId: number, subject: string, body: string): Promise<void> {
        try {
            const result = await mlService.categorizeMessage(subject, body)
            if(result === null) return
            if(!MESSAGE_CATEGORIES.has(result.category)) {
                console.warn(`[messages] categorize: unexpected category "${result.category}", skipping`)
                return
            }
            await repo.upsertTag(messageId, result.category, result.requires_response)
        } catch (err) {
            console.error("[messages] categorize error:", (err as Error).message)
        }
    }

    async forward(messageId: number, senderId: number, recipients: RecipientInput[]): Promise<Message | null> {
        const original = await repo.findById(messageId)
        if(!original) return null
        return repo.createMessage(
            {
                sender_id: senderId,
                title: original.title,
                content: original.content,
                reply_to: null,
                forwarded_from: original.id,
            },
            recipients,
            [],
            []
        )
    }
}

export default new MessagesService()