import "@styles/layouts/MainLayout.scss"
import { Outlet } from "react-router"
import Logo from "../components/ui/Logo"
import { CalendarIcon, InboxIcon } from "@heroicons/react/24/outline"
import NavButton from "../components/ui/NavButton"

function MainLayout() {
    return (
    <>
        <div className="main-layout">
            <aside className="main-sidebar">
                <div className="main-sidebar__logo">
                    <Logo />
                </div>

                <nav className="main-sidebar__nav">
                    <NavButton text="Календарь"
                    path="/"
                    Icon={CalendarIcon}/>
                    <NavButton text="Сообщения"
                    path="/inbox"
                    Icon={InboxIcon} />
                </nav>
            </aside>
        </div>
        <Outlet />
    </>
    )
}

export default MainLayout