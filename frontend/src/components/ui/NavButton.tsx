import clsx from "clsx"
import "@styles/components/ui/NavButton.scss"
import { useNavigate, useLocation } from "react-router"
import type { NavButtonProps } from "./types"

function NavButton({ text, path, Icon, className }: NavButtonProps) {
    const navigate = useNavigate()
    const { pathname } = useLocation()

    return (
        <button className={clsx(className, path == pathname && "selected", "nav-button")}
          onClick={() => navigate(path)}>
            { Icon && <Icon />}
            { text }
        </button>
    )
}

export default NavButton