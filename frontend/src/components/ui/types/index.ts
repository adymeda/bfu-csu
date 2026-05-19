import type { MouseEventHandler } from "react"

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