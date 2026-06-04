export interface MessageRecipientProps {
    name: string,
    isGroup?: boolean,
    icon?: string,
    color?: string,
    children?: React.ReactNode
}

export interface MessageProps {
    title: string,
    author: string,
    authorColor?: string,
    authorIcon?: string,
    isRead?: boolean,
    selected?: boolean,
    text: string,
    date?: string,
    category?: string | null,
    requiresResponse?: boolean,
    onClose?: () => void
}

export interface Recipient {
    id: number
    name: string
    isGroup: boolean
}

export interface ReplyToInfo {
    senderName: string
    content: string
}

export interface MessageCreateProps {
    onClose: () => void
    initialRecipients?: Recipient[]
    initialSubject?: string
    replyTo?: ReplyToInfo
    initialContent?: string
}