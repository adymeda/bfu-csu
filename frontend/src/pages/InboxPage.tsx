import clsx from "clsx"
import { useRef, useState, useEffect } from "react"
import { useLocation } from "react-router"
import { useTranslation } from "react-i18next"
import { EnvelopeIcon, MagnifyingGlassIcon, PencilSquareIcon, StarIcon as StarOutline } from "@heroicons/react/24/outline"
import { StarIcon as StarSolid } from "@heroicons/react/24/solid"
import "@styles/pages/InboxPage.scss"
import Message from "@components/inbox/Message"
import MessageDisplay from "@components/inbox/MessageDisplay"
import MessageCreate from "@components/inbox/MessageCreate"
import {
    useMessages, useMessage, useMarkRead, useToggleFavorite, useDeleteMessage,
    type MessagesFilter
} from "../hooks/messages"
import type { FC, SVGProps } from "react"

type Tab = {
    key?: string
    icon?: FC<SVGProps<SVGSVGElement>>
    activeIcon?: FC<SVGProps<SVGSVGElement>>
}

const TABS: Tab[] = [
    { icon: StarOutline, activeIcon: StarSolid },
    { key: "tabs.incoming" },
    { key: "tabs.sent" },
    { key: "tabs.important" },
    { key: "tabs.events" }
]

// Only favorites and incoming are backed by the API. Sent / important / events
// have no endpoint yet, so those tabs return null and render empty.
function filterForTab(index: number): MessagesFilter | null {
    if(index === 0) return { favorite: true }
    if(index === 1) return {}
    return null
}

function InboxPage() {
    const { t, i18n } = useTranslation('inbox')
    const location = useLocation()
    const [activeTab, setActiveTab] = useState(1)
    const [currentMessageId, setCurrentMessageId] = useState<number | null>(() => {
        const state = location.state as { messageId?: number } | null
        return state?.messageId ?? null
    })
    const [isComposing, setIsComposing] = useState(false)
    const [isClosing, setIsClosing] = useState(false)
    const [search, setSearch] = useState("")
    const tabsRef = useRef<HTMLDivElement>(null)

    const filter = filterForTab(activeTab)
    const messagesQuery = useMessages(filter ?? {}, filter !== null)
    const markRead = useMarkRead()
    const toggleFavorite = useToggleFavorite()
    const deleteMessage = useDeleteMessage()
    const messageQuery = useMessage(currentMessageId)

    const locale = i18n.language === "ru" ? "ru-RU" : "en-US"
    const formatDate = (iso: string) => new Intl.DateTimeFormat(locale, {
        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
    }).format(new Date(iso))

    const allMessages = messagesQuery.data?.pages.flat() ?? []
    const term = search.trim().toLowerCase()
    const messages = term.length === 0
        ? allMessages
        : allMessages.filter(m =>
            m.title.toLowerCase().includes(term) ||
            m.content.toLowerCase().includes(term) ||
            m.sender.display_name.toLowerCase().includes(term))

    const isContentOpen = (currentMessageId !== null || isComposing) && !isClosing

    function handleWheel(e: React.WheelEvent<HTMLDivElement>) {
        if(tabsRef.current) {
            tabsRef.current.scrollLeft += e.deltaY
        }
    }

    function handleMessageClick(id: number) {
        setCurrentMessageId(id)
        setIsComposing(false)
        const item = allMessages.find(m => m.id === id)
        if(item && !item.is_read) markRead.mutate({ id, read: true })
    }

    function handleComposeOpen() {
        setIsComposing(true)
        setCurrentMessageId(null)
    }

    function handleComposeClose() {
        setIsComposing(false)
    }

    function handleMessageClose() {
        if(window.matchMedia("(max-width: 768px)").matches) {
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
            if(e.key !== "Escape") return
            if(isComposing) {
                handleComposeClose()
                return
            }
            if(currentMessageId !== null) handleMessageClose()
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
                        <input
                            placeholder={t('inboxSearchPlaceholder')}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
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
                            </div>
                        )
                    })}
                </div>

                <div className="inbox-sidebar__messages">
                    {messagesQuery.isLoading && (
                        <div className="inbox-sidebar__messages-empty">{t('loading', { defaultValue: 'Загрузка…' })}</div>
                    )}
                    {!messagesQuery.isLoading && messages.length === 0 && (
                        <div className="inbox-sidebar__messages-empty">{t('noMessages', { defaultValue: 'Сообщений нет' })}</div>
                    )}
                    {messages.map(m => (
                        <div key={m.id} onClick={() => handleMessageClick(m.id)}>
                            <Message
                                author={m.sender.display_name}
                                authorColor={`#${m.sender.accent_color}`}
                                title={m.title}
                                text={m.content}
                                isRead={m.is_read}
                                date={formatDate(m.created_at)}
                                selected={currentMessageId === m.id}
                            />
                        </div>
                    ))}
                    {messagesQuery.hasNextPage && (
                        <button
                            className="inbox-sidebar__load-more"
                            onClick={() => messagesQuery.fetchNextPage()}
                            disabled={messagesQuery.isFetchingNextPage}
                        >
                            {t('loadMore', { defaultValue: 'Загрузить ещё' })}
                        </button>
                    )}
                </div>
            </div>
            <div className={clsx("inbox-content", isContentOpen && "inbox-content--active")}>
                {isComposing
                ? <MessageCreate onClose={handleComposeClose} />
                : currentMessageId !== null && messageQuery.data
                ? <MessageDisplay
                    message={messageQuery.data}
                    onClose={handleMessageClose}
                    onToggleFavorite={() => toggleFavorite.mutate({ id: currentMessageId, favorite: !messageQuery.data!.is_favorite })}
                    onDelete={() => deleteMessage.mutate(currentMessageId, { onSuccess: handleMessageClose })}
                  />
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
