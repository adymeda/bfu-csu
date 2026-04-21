import "@styles/layouts/MainLayout.scss"
import { Outlet } from "react-router"
import Logo from "../components/ui/Logo"
import { CalendarIcon, InboxIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline"
import NavButton from "../components/ui/NavButton"
import Avatar from "../components/ui/Avatar"

function MainLayout() {
    return (
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
            <div className="main-body">
                <div className="top-bar">
                    <div className="top-bar__location">
                        <span>Календарь</span>
                        <span>3 мероприятия сегодня</span>
                    </div>

                    <div className="top-bar__search">
                        <input id="context-search" placeholder="Поиск по мероприятиям..."/>
                        <MagnifyingGlassIcon />
                    </div>

                    <div className="top-bar__profile">
                        <Avatar placeholder="Джатус Турбированный" color="#0051ff"/>
                    </div>
                </div>
                <Outlet />
            </div>
        </div>
    )
}

export default MainLayout