import "@styles/components/inbox/MessageCreate.scss"
import type { MessageCreateProps, Recipient } from "./types"
import { ChevronLeftIcon, FlagIcon, GlobeAltIcon, LightBulbIcon, MagnifyingGlassIcon, PaperAirplaneIcon, PaperClipIcon, PlusIcon, UsersIcon, XMarkIcon } from "@heroicons/react/24/outline"
import { useState, useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import clsx from "clsx"
import Dropdown from "@components/ui/Dropdown"
import Avatar from "@components/ui/Avatar"
import MessageRecipient from "./MessageRecipient"
import ScheduleModal, { type SubmitResult } from "./ScheduleModal"
import { useSendMessage } from "../../hooks/messages"
import { useUsers } from "../../hooks/users"
import { useAuth } from "../../contexts/AuthContext"
import { useToast } from "../../contexts/ToastContext"
import { useSearchGroups, useSuggestedRecipients } from "../../hooks/groups"
import { useComposeMessage, useExtractDeadline, useExtractEvent } from "../../hooks/llm"
import { uploadAttachments, formatBytes } from "../../api/attachments"
import type { AttachmentPublic, MessageEventInput, MessageDeadlineInput, ExtractDeadlineResult, ExtractEventResult } from "../../api/types"

type ModalPrefill =
    | { mode: "event" } & ExtractEventResult
    | { mode: "deadline" } & ExtractDeadlineResult
    | null

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

function MessageCreate({ onClose, initialRecipients, initialSubject, replyTo, initialContent }: MessageCreateProps) {
    const { t, i18n } = useTranslation('inbox')
    const [subject, setSubject] = useState(initialSubject ?? "")
    const [body, setBody] = useState(initialContent ?? "")
    const [selected, setSelected] = useState<Recipient[]>(initialRecipients ?? [])
    const [attachments, setAttachments] = useState<AttachmentPublic[]>([])
    const [events, setEvents] = useState<MessageEventInput[]>([])
    const [deadlines, setDeadlines] = useState<MessageDeadlineInput[]>([])
    const [modal, setModal] = useState<"event" | "deadline" | null>(null)
    const [modalPrefill, setModalPrefill] = useState<ModalPrefill>(null)
    const [recipientQuery, setRecipientQuery] = useState("")
    const [detected, setDetected] = useState<DetectionResult>(null)
    const [visible, setVisible] = useState(false)
    const [composePrompt, setComposePrompt] = useState("")
    const [composeWarnings, setComposeWarnings] = useState<string[]>([])

    const locale = i18n.language === "ru" ? "ru-RU" : "en-US"
    const formatDateTime = (iso: string) => new Intl.DateTimeFormat(locale, {
        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
    }).format(new Date(iso))

    function openModal(m: "event" | "deadline") {
        // Dropdown has no imperative close — nudge it shut via an outside mousedown.
        document.dispatchEvent(new MouseEvent("mousedown"))
        setModalPrefill(null)
        setModal(m)
    }

    function handleSchedule(result: SubmitResult) {
        if(result.mode === "event") setEvents(prev => [...prev, result.value])
        else setDeadlines(prev => [...prev, result.value])
        setModal(null)
        setModalPrefill(null)
    }

    function handleModalClose() {
        setModal(null)
        setModalPrefill(null)
    }

    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const { user: currentUser } = useAuth()
    const toast = useToast()
    const sendMessage = useSendMessage()
    const composeMutation = useComposeMessage()
    const extractEventMutation = useExtractEvent()
    const extractDeadlineMutation = useExtractDeadline()
    const extractMutation = detected === "deadline" ? extractDeadlineMutation : extractEventMutation
    const isSearching = recipientQuery.trim().length > 0
    const { data: usersData } = useUsers({ q: recipientQuery, limit: 8 })
    const { data: searchedGroups } = useSearchGroups(recipientQuery)
    const { data: suggested } = useSuggestedRecipients()

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

    const selectedKeys = new Set(selected.map(r => `${r.isGroup ? "g" : "u"}${r.id}`))
    const rawRecipients: Recipient[] = isSearching
        ? [
            ...(usersData?.items ?? []).map(u => ({ id: u.id, name: u.display_name, isGroup: false })),
            ...(searchedGroups ?? []).map(g => ({ id: g.id, name: g.name, isGroup: true })),
        ]
        : (suggested ?? []).map(r => ({ id: r.id, name: r.name, isGroup: r.type === 1 }))
    const available = rawRecipients.filter(r =>
        !selectedKeys.has(`${r.isGroup ? "g" : "u"}${r.id}`) && (r.isGroup || r.id !== currentUser?.id))

    function addRecipient(r: Recipient) {
        setSelected(prev => [...prev, r])
    }

    function removeRecipient(r: Recipient) {
        setSelected(prev => prev.filter(x => !(x.id === r.id && x.isGroup === r.isGroup)))
    }

    async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
        const files = e.target.files
        if(!files || files.length === 0) return
        const slots = 5 - attachments.length
        const picked = Array.from(files).slice(0, slots)
        e.target.value = ""
        if(picked.length === 0) return
        try {
            const uploaded = await uploadAttachments(picked)
            setAttachments(prev => [...prev, ...uploaded])
        } catch { /* ignore upload error for now */ }
    }

    function handleCompose() {
        if(!composePrompt.trim() || composeMutation.isPending) return
        setComposeWarnings([])
        composeMutation.mutate(composePrompt.trim(), {
            onSuccess: (data) => {
                setSubject(data.subject)
                setBody(data.body)
                setSelected(data.recipients.map(r => ({
                    id: r.id,
                    name: r.name,
                    isGroup: r.type === 1,
                })))
                setComposeWarnings(data.warnings)
                if(data.warnings.length === 0) {
                    document.dispatchEvent(new MouseEvent("mousedown"))
                }
            },
            onError: () => toast.error(t("compose.error")),
        })
    }

    function handleExtract() {
        if(extractMutation.isPending) return
        if(detected === "deadline") {
            extractDeadlineMutation.mutate(body, {
                onSuccess: (res) => {
                    setModalPrefill({ mode: "deadline", ...res })
                    setModal("deadline")
                },
                onError: () => {
                    setModalPrefill(null)
                    setModal("deadline")
                    toast.error(t("detection.extractError"))
                },
            })
        } else {
            extractEventMutation.mutate(body, {
                onSuccess: (res) => {
                    setModalPrefill({ mode: "event", ...res })
                    setModal("event")
                },
                onError: () => {
                    setModalPrefill(null)
                    setModal("event")
                    toast.error(t("detection.extractError"))
                },
            })
        }
    }

    const canSend = subject.trim().length > 0 && body.trim().length > 0 && selected.length > 0 && !sendMessage.isPending

    function handleSend() {
        if(!canSend) return
        sendMessage.mutate({
            title: subject.trim(),
            content: body.trim(),
            recipients: selected.map(r => ({ type: r.isGroup ? 1 : 0, id: r.id })),
            ...(attachments.length > 0 && { attachments: attachments.map(a => a.id) }),
            ...(events.length > 0 && { events }),
            ...(deadlines.length > 0 && { deadlines })
        }, {
            onSuccess: () => {
                toast.success("Сообщение отправлено")
                onClose()
            },
            onError: () => toast.error("Сообщение неприемлимо")
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
                                <MessageRecipient key={`${r.isGroup ? "g" : "u"}${r.id}`} name={r.name} isGroup={r.isGroup}>
                                    <button className="message-create__recipient-remove"
                                    onClick={() => removeRecipient(r)}>
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
                                    <input
                                        placeholder={t('recipients.searchPlaceholder')}
                                        value={recipientQuery}
                                        onChange={e => setRecipientQuery(e.target.value)}
                                    />
                                </div>
                                <div className="message-create__recipients-dropdown-list">
                                    {available.length === 0
                                    ? <span className="message-create__recipients-dropdown-empty">{t('recipients.allAdded')}</span>
                                    : available.map(r => (
                                        <div
                                            key={`${r.isGroup ? "g" : "u"}${r.id}`}
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

                    <div className="message-create__body-wrapper">
                        <textarea
                            className="message-create__body"
                            placeholder={t('message.text')}
                            value={body}
                            onChange={e => setBody(e.target.value)}
                        />
                        <Dropdown
                            trigger={
                                <button className="message-create__lightbulb" title={t("compose.tooltip")}>
                                    <LightBulbIcon />
                                </button>
                            }
                        >
                            <div className="message-create__compose-dropdown">
                                <textarea
                                    className="message-create__compose-input"
                                    placeholder={t("compose.placeholder")}
                                    value={composePrompt}
                                    onChange={e => setComposePrompt(e.target.value)}
                                    rows={3}
                                />
                                <button
                                    className="message-create__compose-submit"
                                    onClick={handleCompose}
                                    disabled={!composePrompt.trim() || composeMutation.isPending}
                                >
                                    {composeMutation.isPending
                                        ? <><span className="message-create__spinner" />  {t("compose.generating")}</>
                                        : t("compose.generate")
                                    }
                                </button>
                                {composeWarnings.length > 0 && (
                                    <div className="message-create__compose-warnings">
                                        <span className="message-create__compose-warnings-label">{t("compose.warnings")}</span>
                                        <ul>
                                            {composeWarnings.map((w, i) => (
                                                <li key={i}>{w}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </Dropdown>
                    </div>

                    {replyTo && (
                        <div className="message-create__reply-to">
                            <span className="message-create__reply-to-label">{t("replyTo")}</span>
                            <div className="message-create__reply-to-author">{replyTo.senderName}</div>
                            <p className="message-create__reply-to-content">{replyTo.content}</p>
                        </div>
                    )}

                    {detected && (
                        <div className={clsx("message-create__detection", `message-create__detection--${detected}`, visible && "message-create__detection--visible")}>
                            <span className="message-create__detection-text">
                                {detected === "deadline"
                                    ? t("detection.deadlineText")
                                    : t("detection.eventText")}
                            </span>
                            {extractMutation.isPending
                                ? <span className="message-create__detection-spinner" />
                                : (
                                    <button className="message-create__detection-button" onClick={handleExtract}>
                                        {detected === "deadline" ? t("detection.createDeadline") : t("detection.createEvent")}
                                    </button>
                                )
                            }
                        </div>
                    )}

                    <div className="message-create__footer">
                        <button className="message-create__send-button" onClick={handleSend} disabled={!canSend}>
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
                                <div className="message-create__attachments-dropdown-item" onClick={() => fileInputRef.current?.click()}>
                                    <PaperClipIcon />
                                    <span>{t('attachments.addFile')}</span>
                                </div>
                                <div className="message-create__attachments-dropdown-item" onClick={() => openModal("event")}>
                                    <GlobeAltIcon />
                                    <span>{t('attachments.createEvent')}</span>
                                </div>
                                <div className="message-create__attachments-dropdown-item" onClick={() => openModal("deadline")}>
                                    <FlagIcon />
                                    <span>{t('attachments.createDeadline')}</span>
                                </div>
                            </div>
                        </Dropdown>
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        style={{ display: "none" }}
                        onChange={handleFiles}
                    />
                    {attachments.length === 0 && events.length === 0 && deadlines.length === 0 && (
                        <span className="message-create__attachments-empty">
                            {t('message.attachmentsEmpty')}
                        </span>
                    )}
                    {attachments.map(a => (
                        <div key={`file-${a.id}`} className="message-create__attachment">
                            <PaperClipIcon />
                            <span className="message-create__attachment-name">{a.original_name}</span>
                            <span className="message-create__attachment-size">{formatBytes(a.size_bytes)}</span>
                            <button
                                className="message-create__attachment-remove"
                                onClick={() => setAttachments(prev => prev.filter(x => x.id !== a.id))}>
                                <XMarkIcon />
                            </button>
                        </div>
                    ))}
                    {events.map((ev, i) => (
                        <div key={`ev-${i}`} className="message-create__attachment">
                            <GlobeAltIcon />
                            <span className="message-create__attachment-name">{ev.title}</span>
                            <span className="message-create__attachment-size">{formatDateTime(ev.start_at)}</span>
                            <button
                                className="message-create__attachment-remove"
                                onClick={() => setEvents(prev => prev.filter((_, idx) => idx !== i))}>
                                <XMarkIcon />
                            </button>
                        </div>
                    ))}
                    {deadlines.map((dl, i) => (
                        <div key={`dl-${i}`} className="message-create__attachment">
                            <FlagIcon />
                            <span className="message-create__attachment-name">{dl.title}</span>
                            <span className="message-create__attachment-size">{formatDateTime(dl.due_at)}</span>
                            <button
                                className="message-create__attachment-remove"
                                onClick={() => setDeadlines(prev => prev.filter((_, idx) => idx !== i))}>
                                <XMarkIcon />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
            {modal && (
                <ScheduleModal
                    mode={modal}
                    onClose={handleModalClose}
                    onSubmit={handleSchedule}
                    initialTitle={modalPrefill?.title ?? undefined}
                    initialStart={modalPrefill?.mode === "event" ? (modalPrefill.start_at ?? undefined) : undefined}
                    initialEnd={modalPrefill?.mode === "event" ? (modalPrefill.end_at ?? undefined) : undefined}
                    initialDue={modalPrefill?.mode === "deadline" ? (modalPrefill.due_at ?? undefined) : undefined}
                />
            )}
        </>
    )
}

export default MessageCreate