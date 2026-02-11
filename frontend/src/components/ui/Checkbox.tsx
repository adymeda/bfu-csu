import "@styles/ui/Checkbox.scss"
import type { CheckboxProps } from "./types"

function Checkbox(props: CheckboxProps) {
    let { text } = props
    return (
        <label className="checkbox">
            <input type="checkbox"/>
            <div className="checkbox__skin">
                {/* TODO Add check icon */}
            </div>
            <span>{ text }</span>
        </label>
    )
}

export default Checkbox