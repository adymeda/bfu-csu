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