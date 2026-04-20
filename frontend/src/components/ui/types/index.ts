import type { MouseEventHandler } from "react";

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