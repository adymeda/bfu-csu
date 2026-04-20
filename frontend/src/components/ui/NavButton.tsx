import { useNavigate, useLocation } from "react-router"
import type { NavButtonProps } from "./types"

function NavButton({ text, path, Icon, className }: NavButtonProps) {
    const navigate = useNavigate()
    const { pathname } = useLocation()

    return (
        <button className={`${className ? `${className} `: ""}${path == pathname ? "selected" : ""}`}
          onClick={() => navigate(path)}>
            { Icon && <Icon />}
            { text }
        </button>
    )
}

export default NavButton