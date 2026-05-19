import "@styles/components/ui/Checkbox.scss"
import { CheckIcon } from "@heroicons/react/24/outline"
import type { CheckboxProps } from "./types"

function Checkbox(props: CheckboxProps) {
    const { text, checked, onChange } = props
    return (
        <label className="checkbox">
            <input type="checkbox" checked={checked} onChange={onChange} />
            <div className="checkbox__skin">
                <CheckIcon />
            </div>
            <span>{ text }</span>
        </label>
    )
}

export default Checkbox