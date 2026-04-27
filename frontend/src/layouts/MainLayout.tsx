import "@styles/layouts/MainLayout.scss"
import { Outlet } from "react-router"
import Logo from "../components/ui/Logo"
import { ArrowLeftEndOnRectangleIcon, CalendarIcon, InboxIcon, MagnifyingGlassIcon, Cog6ToothIcon } from "@heroicons/react/24/outline"
import NavButton from "../components/ui/NavButton"
import Avatar from "../components/ui/Avatar"
import Dropdown from "../components/ui/Dropdown"

function getDateInfo() {
    const now = new Date()
    const day = now.getDate()
    const month = now.getMonth()
    const year = now.getFullYear()

    const dayNames = ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"]
    const monthNames = ["января", "февраля", "марта", "апреля", "мая", "июня",
                        "июля", "августа", "сентября", "октября", "ноября", "декабря"]

    const dateStr = `${dayNames[now.getDay()]}, ${day} ${monthNames[month]}`

    let semesterInfo: string | null = null

    const autumnStart = new Date(year, 8, 1) // Sep 1
    const autumnEnd = new Date(year, 11, 31, 23, 59, 59) // Dec 31
    const springStart = new Date(year, 0, 14) // Jan 14
    const springEnd = new Date(year, 5, 14, 23, 59, 59) // Jun 14

    if (now >= autumnStart && now <= autumnEnd) {
        const msPerWeek = 7 * 24 * 60 * 60 * 1000
        const weekNum = Math.ceil((now.getTime() - autumnStart.getTime()) / msPerWeek)
        const parity = weekNum % 2 == 1 ? "верхняя" : "нижняя"
        semesterInfo = `Неделя ${weekNum} (${parity}) • Осенний семестр`
    } else if (now >= springStart && now <= springEnd) {
        const msPerWeek = 7 * 24 * 60 * 60 * 1000
        const weekNum = Math.ceil((now.getTime() - springStart.getTime()) / msPerWeek)
        const parity = weekNum % 2 == 1 ? "верхняя" : "нижняя"
        semesterInfo = `Неделя ${weekNum} (${parity}) • Весенний семестр`
    }

    return { dateStr, semesterInfo }
}

function MainLayout() {
    const { dateStr, semesterInfo } = getDateInfo()

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
                    <div className="top-bar__date">
                        <span className="top-bar__date-day">{dateStr}</span>
                        {semesterInfo && <span className="top-bar__date-info">{semesterInfo}</span>}
                    </div>

                    <div className="top-bar__search">
                        <input id="context-search" placeholder="Поиск по мероприятиям..."/>
                        <MagnifyingGlassIcon />
                    </div>

                    <Dropdown
                      trigger={<Avatar placeholder="Джатус Турбированный" color="#0051ff"/>}
                      triggerClassName="top-bar__profile">
                        <NavButton text="Настройки"
                            Icon={Cog6ToothIcon}
                            path="/settings"/>
                        <NavButton text="Выйти"
                            Icon={ArrowLeftEndOnRectangleIcon}
                            path="/logout" />
                    </Dropdown>
                </div>
                <div className="main-content">
                    <Outlet />
                </div>
            </div>
        </div>
    )
}

export default MainLayout