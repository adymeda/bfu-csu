import type { MouseEventHandler } from "react"

export interface ButtonProps {
    onClick: MouseEventHandler,
    buttonLevel?: 1 | 2 | 3,
    buttonType?: "submit" | "button" | "reset",
    children?: any
}

export interface CheckboxProps {
    text: string
}

export interface LogoProps {
    className?: string
}

export interface NavButtonProps {
    text: string,
    path: string,
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