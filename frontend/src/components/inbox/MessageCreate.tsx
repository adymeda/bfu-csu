import "@styles/components/inbox/MessageCreate.scss"
import type { MessageCreateProps, Recipient } from "./types"
import { ChevronLeftIcon, GlobeAltIcon, MagnifyingGlassIcon, PaperAirplaneIcon, PaperClipIcon, PlusIcon, UsersIcon, XMarkIcon } from "@heroicons/react/24/outline"
import { useState, useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import clsx from "clsx"

// ─── Event / deadline detection ──────────────────────────────────────────────

const TIME_REFS =
	"конца|утра|вечера|ночи|завтра|послезавтра|" +
	"понедельника|вторника|среды|четверга|пятницы|субботы|воскресенья|" +
	"января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря"

const UNTIL_PATTERN = new RegExp(`до\\s+(?:${TIME_REFS}|\\d)`, "i")
const FROM_PATTERN  = new RegExp(`с\\s+(?:${TIME_REFS}|\\d)`, "i")
const DEADLINE_KEYWORD = /дедлайн|deadline|крайний срок|не позднее/i
const EVENT_KEYWORD =
	/встреча|созвон|звонок|собрание|презентация|демо|конференция|вебинар|интервью|напомни|запланировано|планируется|мероприятие|состоится|встретимся|созвонимся|увидимся|приходи|приходите|присоединяйся|подключайся/i
const DATE_PATTERNS = [
	/\d{1,2}[./]\d{1,2}([./]\d{2,4})?/,
	/\d{1,2}\s+(?:января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)/i,
	/(?:сегодня|завтра|послезавтра)/i,
	/(?:в\s+)?(?:понедельник|вторник|среду|четверг|пятницу|субботу|воскресенье)/i,
	/в\s+\d{1,2}(?::\d{2})?(?:\s*(?:часов?|утра|вечера|дня|ночи))?/i,
	/\d{1,2}\s*(?:часов?|утра|вечера|дня|ночи)/i,
]

type DetectionResult = "deadline" | "event" | null

function detectContent(text: string): DetectionResult {
	if (!text.trim()) return null
	const hasUntil = UNTIL_PATTERN.test(text)
	const hasFrom  = FROM_PATTERN.test(text)
	if (DEADLINE_KEYWORD.test(text) || (hasUntil && !hasFrom)) return "deadline"
	const hasDate = DATE_PATTERNS.some(p => p.test(text))
	if (EVENT_KEYWORD.test(text) || hasDate) return "event"
	return null
}
import Dropdown from "@components/ui/Dropdown"
import Avatar from "@components/ui/Avatar"
import MessageRecipient from "./MessageRecipient"

const MOCK_RECIPIENTS: Recipient[] = [
    { id: "1", name: "Ишанов Сергей Александрович", isGroup: false },
    { id: "2", name: "Савкин Дмитрий Александрович", isGroup: false },
    { id: "3", name: "4ПМ АДМО", isGroup: true },
    { id: "4", name: "Кулдышев Никита Андреевич", isGroup: false },
]

function MessageCreate({ onClose, onSend }: MessageCreateProps) {
    const { t } = useTranslation('inbox')
    const [subject, setSubject] = useState("")
    const [body, setBody] = useState("")
    const [selected, setSelected] = useState<Recipient[]>([])
    const [attachments] = useState<string[]>([])
    const [detected, setDetected] = useState<DetectionResult>(null)
    const [visible, setVisible] = useState(false)
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => {
            const result = detectContent(body)
            if (result) {
                setDetected(result)
                requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)))
            } else {
                setVisible(false)
                if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
                hideTimerRef.current = setTimeout(() => setDetected(null), 300)
            }
        }, 1000)
        return () => { if (timerRef.current) clearTimeout(timerRef.current) }
    }, [body])

    const selectedIds = new Set(selected.map(r => r.id))
    const available = MOCK_RECIPIENTS.filter(r => !selectedIds.has(r.id))

    function addRecipient(r: Recipient) {
        setSelected(prev => [...prev, r])
    }

    function removeRecipient(id: string) {
        setSelected(prev => prev.filter(r => r.id !== id))
    }

    function handleSend() {
        onSend?.({
            subject,
            body,
            recipientIds: selected.map(r => r.id)
        })
    }

    return (
        <>
            <div className="message-create__header">
                <ChevronLeftIcon className="message-create__header-back" onClick={onClose} />
                <input className="message-create__header-subject"
                    placeholder={t('message.topic')}
                    value={subject}
                    onChange={e => setSubject(e.target.value)} />
                <XMarkIcon className="message-create__header-close" onClick={onClose} />
            </div>

            <div className="message-create__content">
                <div className="message-create__text-area">
                    <div className="message-create__recipients">
                        <span className="message-create__recipients-label">{t('message.toRecipients')}</span>
                        <div className="message-create__recipients-list">
                            {selected.map(r => (
                                <MessageRecipient key={r.id} name={r.name} isGroup={r.isGroup}>
                                    <button className="message-create__recipient-remove"
                                    onClick={() => removeRecipient(r.id)}>
                                        <XMarkIcon />
                                    </button>
                                </MessageRecipient>
                            ))}
                        </div>
                        <Dropdown trigger={
                                <button className="message-create__add-button">
                                    <PlusIcon />
                                </button>
                        }>
                            <div className="message-create__recipients-dropdown">
                                <div className="message-create__recipients-dropdown-search">
                                    <MagnifyingGlassIcon />
                                    <input placeholder={t('recipients.searchPlaceholder')} />
                                </div>
                                <div className="message-create__recipients-dropdown-list">
                                    {available.length === 0
                                    ? <span className="message-create__recipients-dropdown-empty">{t('recipients.allAdded')}</span>
                                    : available.map(r => (
                                        <div
                                            key={r.id}
                                            className="message-create__recipients-dropdown-item"
                                            onClick={() => addRecipient(r)}
                                        >
                                            {r.isGroup
                                                ? <UsersIcon />
                                                : <Avatar placeholder={r.name} />
                                            }
                                            <span>{r.name}</span>
                                        </div>
                                    ))
                                    }
                                </div>
                            </div>
                        </Dropdown>
                    </div>

                    <textarea
                        className="message-create__body"
                        placeholder={t('message.text')}
                        value={body}
                        onChange={e => setBody(e.target.value)}
                    />

                    {detected && (
                        <div className={clsx("message-create__detection", `message-create__detection--${detected}`, visible && "message-create__detection--visible")}>
                            <span className="message-create__detection-text">
                                {detected === "deadline"
                                    ? "В тексте упоминается дедлайн. Хотите добавить его?"
                                    : "В тексте упоминается событие. Хотите создать его?"}
                            </span>
                            <button className="message-create__detection-button">
                                {detected === "deadline" ? "Добавить дедлайн" : "Создать событие"}
                            </button>
                        </div>
                    )}

                    <div className="message-create__footer">
                        <button className="message-create__send-button" onClick={handleSend}>
                            <PaperAirplaneIcon />
                            <span>{t('message.send')}</span>
                        </button>
                    </div>
                </div>

                <div className="message-create__attachments-area">
                    <div className="message-create__attachments-header">
                        <span className="message-create__attachments-title">{t('message.attachments')}</span>
                        <Dropdown
                            trigger={
                                <button className="message-create__add-button">
                                    <PlusIcon />
                                </button>
                            }
                        >
                            <div className="message-create__attachments-dropdown">
                                <div className="message-create__attachments-dropdown-item">
                                    <PaperClipIcon />
                                    <span>{t('attachments.addFile')}</span>
                                </div>
                                <div className="message-create__attachments-dropdown-item">
                                    <GlobeAltIcon />
                                    <span>{t('attachments.createEvent')}</span>
                                </div>
                            </div>
                        </Dropdown>
                    </div>
                    {attachments.length === 0 && (
                        <span className="message-create__attachments-empty">
                            {t('message.attachmentsEmpty')}
                        </span>
                    )}
                </div>
            </div>
        </>
    )
}

export default MessageCreate