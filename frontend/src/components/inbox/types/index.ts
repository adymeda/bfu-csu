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
    onClose?: () => void
}

export interface Recipient {
    id: string
    name: string
    isGroup: boolean
}

export interface MessageCreateData {
    subject: string
    body: string
    recipientIds: string[]
}

export interface MessageCreateProps {
    onClose: () => void
    onSend?: (data: MessageCreateData) => void
}