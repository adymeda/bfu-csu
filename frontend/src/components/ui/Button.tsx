import "@styles/ui/Button.scss"
import type { ButtonProps } from "./types"

function Button(props: ButtonProps) {
    const { children, onClick } = props
    return (
        <div className="button" onClick={onClick}>
            { children }
        </div>
    )
}

export default Button