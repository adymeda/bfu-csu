import repo from "../repositories/message.repo"
import type { Message, MessageListItem, MessageDetail, CreateMessageDto, RecipientInput, MessageListQuery, MessageStateUpdate } from "../types/message"

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
            dto.recipients
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
            recipients
        )
    }
}

export default new MessagesService()