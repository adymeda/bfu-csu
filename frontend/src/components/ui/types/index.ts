import type { MouseEventHandler } from "react";

export interface ButtonProps {
    onClick: MouseEventHandler,
    buttonType?: "submit" | "button" | "reset",
    children?: any
}

export interface CheckboxProps {
    text: string
}