import clsx from "clsx"
import { useRef, useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { EnvelopeIcon, MagnifyingGlassIcon, PencilSquareIcon, StarIcon as StarOutline } from "@heroicons/react/24/outline"
import { StarIcon as StarSolid } from "@heroicons/react/24/solid"
import "@styles/pages/InboxPage.scss"
import Message from "@components/inbox/Message"
import MessageDisplay from "@components/inbox/MessageDisplay"
import MessageCreate from "@components/inbox/MessageCreate"
import type { FC, SVGProps } from "react"

type Tab = {
    key?: string
    icon?: FC<SVGProps<SVGSVGElement>>
    activeIcon?: FC<SVGProps<SVGSVGElement>>
    count?: number
}

const TABS: Tab[] = [
    { icon: StarOutline, activeIcon: StarSolid },
    { key: "tabs.incoming", count: 3 },
    { key: "tabs.sent" },
    { key: "tabs.important" },
    { key: "tabs.events", count: 1 }
]

function InboxPage() {
    const { t } = useTranslation('inbox')
    const [activeTab, setActiveTab] = useState(1)
    const [currentMessageId, setCurrentMessageId] = useState<number | null>(null)
    const [isComposing, setIsComposing] = useState(false)
    const [isClosing, setIsClosing] = useState(false)
    const tabsRef = useRef<HTMLDivElement>(null)

    const isContentOpen = (currentMessageId !== null || isComposing) && !isClosing

    function handleWheel(e: React.WheelEvent<HTMLDivElement>) {
        if (tabsRef.current) {
            tabsRef.current.scrollLeft += e.deltaY
        }
    }

    function handleMessageClick(id: number) {
        setCurrentMessageId(id)
        setIsComposing(false)
    }

    function handleComposeOpen() {
        setIsComposing(true)
        setCurrentMessageId(null)
    }

    function handleComposeClose() {
        setIsComposing(false)
    }

    function handleMessageClose() {
        if (window.matchMedia("(max-width: 768px)").matches) {
            setIsClosing(true)
            setTimeout(() => {
                setCurrentMessageId(null)
                setIsClosing(false)
            }, 250)
        } else {
            setCurrentMessageId(null)
        }
    }

    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            if (e.key !== "Escape") return
            if (isComposing) {
                handleComposeClose()
                return
            }
            if (currentMessageId !== null) handleMessageClose()
        }
        document.addEventListener("keydown", onKeyDown)
        return () => document.removeEventListener("keydown", onKeyDown)
    }, [currentMessageId, isComposing, isClosing])

    return (
        <div className="inbox">
            <div className="inbox-sidebar">
                <div className="inbox-sidebar__header">
                    <div className="inbox-sidebar__search">
                        <MagnifyingGlassIcon />
                        <input placeholder={t('inboxSearchPlaceholder')} />
                    </div>
                    <button className="inbox-sidebar__new-message" onClick={handleComposeOpen}>
                        <PencilSquareIcon />
                    </button>
                </div>

                <div className="inbox-sidebar__tabs" ref={tabsRef} onWheel={handleWheel}>
                    {TABS.map((tab, i) => {
                        const isActive = activeTab === i
                        const IconToRender = isActive ? (tab.activeIcon ?? tab.icon) : tab.icon
                        return (
                            <div
                                key={tab.key ?? i}
                                className={clsx("inbox-sidebar__tab", isActive && "active")}
                                onClick={() => setActiveTab(i)}
                            >
                                <span className={clsx("inbox-sidebar__tab-name", IconToRender && "inbox-sidebar__tab-name--icon")}>
                                    {IconToRender && <IconToRender />}
                                    {tab.key && t(tab.key)}
                                </span>
                                {tab.count !== undefined && (
                                    <span className="inbox-sidebar__tab-count">{tab.count}</span>
                                )}
                            </div>
                        )
                    })}
                </div>

                <div className="inbox-sidebar__messages">
                    <div className="inbox-sidebar__messages-date">
                        11 мая 2026
                    </div>
                    <div onClick={() => handleMessageClick(1)}>
                        <Message author="Ишанов Сергей Александрович" title="Переписка контрольных по дифференциальным уравнениям" text="Следующая переписка контрольных работ по дифференциальным уравнениям пройдёт 14 апреля в 13:50, аудитория 229. Старосты должны предварительно предоставить списки переписываемых контрольных работ" isRead={false} selected={currentMessageId === 1}/>
                    </div>
                </div>
            </div>
            <div className={clsx("inbox-content", isContentOpen && "inbox-content--active")}>
                {isComposing
                ? <MessageCreate onClose={handleComposeClose} />
                : currentMessageId !== null
                ? <MessageDisplay author="Ишанов Сергей Александрович" title="Переписка контрольных по дифференциальным уравнениям" text="Следующая переписка контрольных работ по дифференциальным уравнениям пройдёт 14 апреля в 13:50, аудитория 229. Старосты должны предварительно предоставить списки переписываемых контрольных работ" onClose={handleMessageClose}/>
                : <div className="inbox-content__empty">
                    <EnvelopeIcon />
                    <span>{t('selectMessage')}</span>
                </div>
                }
            </div>
        </div>
    )
}

export default InboxPage