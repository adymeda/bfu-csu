import "@styles/components/ui/Checkbox.scss"
import { CheckIcon } from "@heroicons/react/24/outline"
import type { CheckboxProps } from "./types"

function Checkbox(props: CheckboxProps) {
    let { text } = props
    return (
        <label className="checkbox">
            <input type="checkbox"/>
            <div className="checkbox__skin">
                {/* TODO Add check icon */}
                <CheckIcon />
            </div>
            <span>{ text }</span>
        </label>
    )
}

export default Checkbox