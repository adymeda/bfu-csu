import clsx from "clsx"
import "@styles/components/inbox/MessageDisplay.scss"
import type { MessageDetail } from "../../api/types"
import { ArrowDownTrayIcon, ArrowTurnUpRightIcon, ArrowUpRightIcon, ArrowUturnLeftIcon, ChevronDownIcon, ChevronLeftIcon, ClipboardDocumentListIcon, FlagIcon, GlobeAltIcon, PaperClipIcon, StarIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline"
import { StarIcon as StarSolid } from "@heroicons/react/24/solid"
import { useTranslation } from "react-i18next"
import Avatar from "@components/ui/Avatar"
import MessageRecipient from "./MessageRecipient"
import MessageAttachment from "./MessageAttachment"
import { downloadAttachment, formatBytes } from "../../api/attachments"
import { EVENT_COLOR, DEADLINE_COLOR } from "../calendar/adapters"
import { useLayoutEffect, useRef, useState } from "react"

interface MessageDisplayProps {
    message: MessageDetail
    onClose?: () => void
    onToggleFavorite?: () => void
    onDelete?: () => void
}

function MessageDisplay({ message, onClose, onToggleFavorite, onDelete }: MessageDisplayProps) {
    const { t, i18n } = useTranslation('inbox')
    const [expanded, setExpanded] = useState(false)
    const [hasOverflow, setHasOverflow] = useState(false)
    const [rowHeight, setRowHeight] = useState(0)
    const listRef = useRef<HTMLDivElement>(null)

    const locale = i18n.language === "ru" ? "ru-RU" : "en-US"
    const dateLabel = new Intl.DateTimeFormat(locale, {
        day: "numeric", month: "long", hour: "2-digit", minute: "2-digit"
    }).format(new Date(message.created_at))

    function timeRange(startIso: string, endIso: string | null): string {
        const fmt = new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })
        const start = fmt.format(new Date(startIso))
        if(!endIso) return start
        const endTime = new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(new Date(endIso))
        return `${start} - ${endTime}`
    }

    useLayoutEffect(() => {
        const el = listRef.current
        if(!el) return

        const firstChild = el.firstElementChild as HTMLElement | null
        if(!firstChild) return

        const h = firstChild.offsetHeight
        setRowHeight(h)
        setHasOverflow(el.scrollHeight > h + 2)
    }, [message.id])

    return (
        <>
        <div className="message-display__header">
            <ChevronLeftIcon className="message-display__header-back" onClick={onClose} />
            <div className="message-display__header-info">
                <div className="message-display__header-title">
                    {message.title}
                </div>
                <div className="message-display__header-author">
                    <Avatar placeholder={message.sender.display_name} color={`#${message.sender.accent_color}`} />
                    <span>{message.sender.display_name}</span>
                </div>
            </div>
            <div className="message-display__header-time">
                {dateLabel}
            </div>
            <div className="message-display__header-buttons">
                <button className="message-display__header-icon" title={t("message.favorite")} onClick={onToggleFavorite}>
                    {message.is_favorite ? <StarSolid /> : <StarIcon />}
                </button>
                <button className="message-display__header-icon" title={t("message.delete")} onClick={onDelete}>
                    <TrashIcon />
                </button>
                <XMarkIcon className="message-display__header-close" onClick={onClose} />
            </div>
        </div>
        <div className="message-display__content">
            <div className="message-display__text-area">
                {message.recipients.length > 0 && (
                    <div className="message-display__text-recipients">
                        <span>{t('message.toRecipients')}</span>
                        <div ref={listRef}
                            className="message-display__text-recipients-list"
                            style={{ maxHeight: expanded ? undefined : rowHeight || undefined }}>
                            {message.recipients.map(r => (
                                <MessageRecipient
                                    key={`${r.type}-${r.id}`}
                                    name={r.name}
                                    isGroup={r.type === 1}
                                    {...(r.accent_color ? { color: `#${r.accent_color}` } : {})}
                                />
                            ))}
                        </div>
                        {hasOverflow && (
                            <button
                                className={clsx("message-display__text-recipients-extend", expanded && "expanded")}
                                onClick={() => setExpanded(v => !v)}>
                                <ChevronDownIcon />
                            </button>
                        )}
                    </div>
                )}

                <div className="message-display__text-content">
                    { message.content }
                </div>

                <div className="message-display__text-area-buttons">
                    <button>
                        <ArrowUturnLeftIcon />
                        <span>{t('message.reply')}</span>
                    </button>
                    <button>
                        <ArrowTurnUpRightIcon />
                        <span>{t('message.forward')}</span>
                    </button>
                    <button>
                        <ArrowUpRightIcon />
                        <span>{t('message.replyAll')}</span>
                    </button>
                    <button onClick={() => navigator.clipboard?.writeText(message.content)}>
                        <ClipboardDocumentListIcon />
                        <span>{t('message.copyText')}</span>
                    </button>
                </div>
            </div>

            {(message.attachments.length > 0 || message.events.length > 0 || message.deadlines.length > 0) && (
                <div className="message-display__attachments-area">
                    <div className="message-display__attachments-area-title">{t('message.attachments')}</div>
                    {message.attachments.map(att => (
                        <MessageAttachment
                            key={`att-${att.id}`}
                            icon={<PaperClipIcon />}
                            name={att.original_name}
                            description={formatBytes(att.size_bytes)}
                            action={
                                <button title={t("message.download")} onClick={() => downloadAttachment(att)}>
                                    <ArrowDownTrayIcon />
                                </button>
                            }
                        />
                    ))}
                    {message.events.map(ev => (
                        <MessageAttachment
                            key={`ev-${ev.id}`}
                            icon={<GlobeAltIcon />}
                            name={ev.title}
                            description={timeRange(ev.start_at, ev.end_at)}
                            accentColor={EVENT_COLOR}
                        />
                    ))}
                    {message.deadlines.map(dl => (
                        <MessageAttachment
                            key={`dl-${dl.id}`}
                            icon={<FlagIcon />}
                            name={dl.title}
                            description={timeRange(dl.due_at, null)}
                            accentColor={DEADLINE_COLOR}
                        />
                    ))}
                </div>
            )}
        </div>
        </>
    )
}

export default MessageDisplay
