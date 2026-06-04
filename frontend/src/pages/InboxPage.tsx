import clsx from "clsx"
import { useRef, useState, useEffect } from "react"
import { useLocation } from "react-router"
import { useTranslation } from "react-i18next"
import { EnvelopeIcon, LightBulbIcon, MagnifyingGlassIcon, PencilSquareIcon, StarIcon as StarOutline } from "@heroicons/react/24/outline"
import { StarIcon as StarSolid } from "@heroicons/react/24/solid"
import "@styles/pages/InboxPage.scss"
import Message from "@components/inbox/Message"
import MessageDisplay from "@components/inbox/MessageDisplay"
import MessageCreate from "@components/inbox/MessageCreate"
import InboxSummary from "@components/inbox/InboxSummary"
import Dropdown from "@components/ui/Dropdown"
import {
    useMessages, useMessage, useMarkRead, useToggleFavorite, useDeleteMessage,
    type MessagesFilter
} from "../hooks/messages"
import type { Recipient, ReplyToInfo } from "../components/inbox/types"
import type { FC, SVGProps } from "react"

type ComposeContext = {
    initialRecipients?: Recipient[]
    initialSubject?: string
    replyTo?: ReplyToInfo
    initialContent?: string
}

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
    { key: "tabs.study" },
    { key: "tabs.org" },
    { key: "tabs.personal" },
    { key: "tabs.announce" },
    { key: "tabs.events" },
    { key: "tabs.deadlines" },
]

function filterForTab(index: number): MessagesFilter {
    if(index === 0) return { favorite: true }
    if(index === 1) return { box: "inbox" }
    if(index === 2) return { box: "sent" }
    if(index === 3) return { requires_response: true }
    if(index === 4) return { box: "inbox", category: "учебное" }
    if(index === 5) return { box: "inbox", category: "организационное" }
    if(index === 6) return { box: "inbox", category: "личное" }
    if(index === 7) return { box: "inbox", category: "объявление" }
    if(index === 8) return { has_events: true }
    if(index === 9) return { has_deadlines: true }
    return { box: "inbox" }
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
    const [composeContext, setComposeContext] = useState<ComposeContext>({})
    const [isClosing, setIsClosing] = useState(false)
    const [search, setSearch] = useState("")
    const tabsRef = useRef<HTMLDivElement>(null)

    const filter = filterForTab(activeTab)
    const messagesQuery = useMessages(filter)
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
        setComposeContext({})
        setCurrentMessageId(null)
    }

    function handleComposeClose() {
        setIsComposing(false)
        setComposeContext({})
    }

    function handleReply(sender: Recipient, title: string, content: string) {
        setIsComposing(true)
        setCurrentMessageId(null)
        setComposeContext({
            initialRecipients: [sender],
            initialSubject: `Re: ${title}`,
            replyTo: { senderName: sender.name, content }
        })
    }

    function handleForward(recipients: Recipient[], title: string, content: string) {
        setIsComposing(true)
        setCurrentMessageId(null)
        setComposeContext({
            initialRecipients: recipients,
            initialSubject: `Fwd: ${title}`,
            initialContent: content
        })
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
                    <Dropdown
                        className="inbox-sidebar__summary-menu"
                        trigger={
                            <button className="inbox-sidebar__summary-btn" title={t("summary.tooltip")}>
                                <LightBulbIcon />
                            </button>
                        }
                    >
                        <InboxSummary />
                    </Dropdown>
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
                                category={m.category}
                                requiresResponse={m.requires_response ?? false}
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
                ? <MessageCreate onClose={handleComposeClose} {...composeContext} />
                : currentMessageId !== null && messageQuery.data
                ? <MessageDisplay
                    message={messageQuery.data}
                    onClose={handleMessageClose}
                    onToggleFavorite={() => toggleFavorite.mutate({ id: currentMessageId, favorite: !messageQuery.data!.is_favorite })}
                    onDelete={() => deleteMessage.mutate(currentMessageId, { onSuccess: handleMessageClose })}
                    onReply={handleReply}
                    onForward={handleForward}
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
