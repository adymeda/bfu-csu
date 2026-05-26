export interface ExternalLinkCardProps {
    icon: string
    name: string
    linkedValue?: string
    onLink?: () => void
    onUnlink?: () => void
    children?: React.ReactNode
}