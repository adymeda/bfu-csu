import clsx from "clsx"
import "@styles/components/ui/NavButton.scss"
import { useNavigate, useLocation } from "react-router"
import type { NavButtonProps } from "./types"

function NavButton({ text, path, onClick, Icon, className }: NavButtonProps) {
    const navigate = useNavigate()
    const { pathname } = useLocation()

    function handleClick() {
        if(onClick) {
            onClick()
        } else if(path) {
            navigate(path)
        }
    }

    return (
        <button className={clsx(className, path != null && path == pathname && "selected", "nav-button")}
          onClick={handleClick}>
            { Icon && <Icon />}
            { text }
        </button>
    )
}

export default NavButton