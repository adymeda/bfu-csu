import clsx from "clsx"
import "@styles/components/ui/Button.scss"
import type { ButtonProps } from "./types"

const buttonLevels = {
    1: "primary",
    2: "secondary",
    3: "misc"
}

function Button(props: ButtonProps) {
    let { buttonLevel, children, onClick, buttonType, disabled } = props
    if(!buttonType) buttonType = "button"
    if(!buttonLevel) buttonLevel = 1
    const className = clsx("button", `button-${buttonLevels[buttonLevel]}`)

    return (
        <button type={buttonType} className={className} onClick={onClick} disabled={disabled}>
            { children }
        </button>
    )
}

export default Button