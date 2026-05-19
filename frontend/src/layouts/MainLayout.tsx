import "@styles/layouts/MainLayout.scss"
import { Outlet, useNavigate } from "react-router"
import { useTranslation } from "react-i18next"
import Logo from "../components/ui/Logo"
import { ArrowLeftEndOnRectangleIcon, CalendarIcon, InboxIcon, MagnifyingGlassIcon, Cog6ToothIcon } from "@heroicons/react/24/outline"
import NavButton from "../components/ui/NavButton"
import Avatar from "../components/ui/Avatar"
import Dropdown from "../components/ui/Dropdown"
import { useAuth } from "../contexts/AuthContext"
import type { TFunction } from "i18next"

function getDateInfo(t: TFunction, lng: string) {
    const now = new Date()
    const locale = lng === 'ru' ? 'ru-RU' : 'en-US'

    const weekday = new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(now)
    const dayMonth = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long' }).format(now)
    const dateStr = `${weekday.charAt(0).toUpperCase() + weekday.slice(1)}, ${dayMonth}`

    const year = now.getFullYear()

    const autumnStart = new Date(year, 8, 1)
    const autumnEnd = new Date(year, 11, 31, 23, 59, 59)
    const springStart = new Date(year, 0, 14)
    const springEnd = new Date(year, 5, 14, 23, 59, 59)

    let semesterInfo: string | null = null
    const msPerWeek = 7 * 24 * 60 * 60 * 1000

    if(now >= autumnStart && now <= autumnEnd) {
        const weekNum = Math.ceil((now.getTime() - autumnStart.getTime()) / msPerWeek)
        const parity = t(weekNum % 2 === 1 ? 'weekParity.upper' : 'weekParity.lower')
        semesterInfo = t('weekInfo', { week: weekNum, parity, semester: t('semesterType.autumn') })
    } else if(now >= springStart && now <= springEnd) {
        const weekNum = Math.ceil((now.getTime() - springStart.getTime()) / msPerWeek)
        const parity = t(weekNum % 2 === 1 ? 'weekParity.upper' : 'weekParity.lower')
        semesterInfo = t('weekInfo', { week: weekNum, parity, semester: t('semesterType.spring') })
    }

    return { dateStr, semesterInfo }
}

function MainLayout() {
    const { t } = useTranslation('common')
    const { i18n } = useTranslation()
    const { dateStr, semesterInfo } = getDateInfo(t, i18n.language)
    const { user, logout } = useAuth()
    const navigate = useNavigate()

    async function handleLogout() {
        await logout()
        navigate("/auth")
    }

    const username = user?.display_name ?? ""
    const avatarColor = user ? "#" + user.accent_color : undefined

    return (
        <div className="main-layout">
            <aside className="main-sidebar">
                <div className="main-sidebar__logo">
                    <Logo />
                </div>

                <nav className="main-sidebar__nav">
                    <NavButton text={t('navigation.calendar')}
                    path="/"
                    Icon={CalendarIcon}/>
                    <NavButton text={t('navigation.inbox')}
                    path="/inbox"
                    Icon={InboxIcon} />
                    <button className="mobile-profile-button nav-button" onClick={() => {}}>
                        <Avatar placeholder={username} color={avatarColor} />
                        Профиль
                    </button>
                </nav>
            </aside>
            <div className="main-body">
                <div className="top-bar">
                    <div className="top-bar__date">
                        <span className="top-bar__date-day">{dateStr}</span>
                        {semesterInfo && <span className="top-bar__date-info">{semesterInfo}</span>}
                    </div>

                    <div className="top-bar__search">
                        <input id="context-search" placeholder={t('searchPlaceholder')}/>
                        <MagnifyingGlassIcon />
                    </div>

                    <Dropdown
                    trigger={<Avatar placeholder={username} color={avatarColor}/>}
                    triggerClassName="top-bar__profile">
                        <NavButton text={t('navigation.settings')}
                            Icon={Cog6ToothIcon}
                            path="/settings"/>
                        <NavButton text={t('logOut')}
                            Icon={ArrowLeftEndOnRectangleIcon}
                            onClick={handleLogout} />
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
