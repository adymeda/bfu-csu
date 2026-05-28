export interface ExternalLinkCardProps {
    icon: string
    name: string
    linkedValue?: string
    inputPlaceholder?: string
    onLink?: (code: string) => void
    onUnlink?: () => void
    isLinking?: boolean
    error?: string | null
    children?: React.ReactNode
}