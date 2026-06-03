import type { MouseEventHandler } from "react"
import type { Toast } from "../../../contexts/types"

export interface ToastProps {
    toast: Toast
    onDismiss: (id: string) => void
}

export interface ButtonProps {
    onClick?: MouseEventHandler,
    buttonLevel?: 1 | 2 | 3,
    buttonType?: "submit" | "button" | "reset",
    disabled?: boolean,
    children?: any
}

export interface CheckboxProps {
    text: string,
    checked?: boolean,
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export interface LogoProps {
    className?: string
}

export interface NavButtonProps {
    text: string,
    path?: string,
    onClick?: () => void,
    Icon?: React.ForwardRefExoticComponent<Omit<React.SVGProps<SVGSVGElement>, "ref"> & {
            title?: string
            titleId?: string
        } & React.RefAttributes<SVGSVGElement>>,
    className?: string
}

export interface AvatarProps {
    image?: string,
    placeholder?: string,
    color?: string
}

export interface DropdownProps {
    trigger: React.ReactNode,
    children: React.ReactNode,
    className?: string,
    triggerClassName?: string
}

export interface ModalProps {
    title: string,
    onClose: () => void,
    children: React.ReactNode,
    footer?: React.ReactNode
}

export interface TabItem {
    key: string,
    label: string
}

export interface TabsProps {
    tabs: TabItem[],
    activeKey: string,
    onChange: (key: string) => void
}

export interface TreeMember {
    display_name: string,
    accent_color: string,
    image?: string,
    isAdmin?: boolean
}

export interface TreeNode {
    id: string|number,
    label: string,
    children?: TreeNode[],
    members?: TreeMember[]
}

export interface TreeProps {
    nodes: TreeNode[],
    selectedId?: string | number,
    onSelect?: (node: TreeNode) => void
}

export interface TreeBranchProps {
    node: TreeNode,
    selectedId?: string | number,
    onSelect?: (node: TreeNode) => void
}