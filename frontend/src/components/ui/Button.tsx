import "@styles/ui/Button.scss"
import type { ButtonProps } from "./types"

function Button(props: ButtonProps) {
    let { children, onClick, buttonType } = props
    if(!buttonType) buttonType = "button"
    return (
        <button type={buttonType} className="button" onClick={onClick}>
            { children }
        </button>
    )
}

export default Button