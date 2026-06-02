import clsx from "clsx"
import "@styles/components/inbox/MessageDisplay.scss"
import type { MessageDetail } from "../../api/types"
import { ArrowDownTrayIcon, ArrowTurnUpRightIcon, ArrowUpRightIcon, ArrowUturnLeftIcon, ChevronDownIcon, ChevronLeftIcon, ClipboardDocumentListIcon, FlagIcon, GlobeAltIcon, MagnifyingGlassIcon, PaperClipIcon, StarIcon, TrashIcon, UsersIcon, XMarkIcon } from "@heroicons/react/24/outline"
import { StarIcon as StarSolid } from "@heroicons/react/24/solid"
import { useTranslation } from "react-i18next"
import Avatar from "@components/ui/Avatar"
import MessageRecipient from "./MessageRecipient"
import MessageAttachment from "./MessageAttachment"
import Modal from "@components/ui/Modal"
import Button from "@components/ui/Button"
import { downloadAttachment, formatBytes } from "../../api/attachments"
import { EVENT_COLOR, DEADLINE_COLOR } from "../calendar/adapters"
import { useLayoutEffect, useRef, useState } from "react"
import { useUsers } from "../../hooks/users"
import { useSearchGroups } from "../../hooks/groups"
import { useAuth } from "../../contexts/AuthContext"
import type { Recipient } from "./types"

interface MessageDisplayProps {
	message: MessageDetail
	onClose?: () => void
	onToggleFavorite?: () => void
	onDelete?: () => void
	onReply?: (sender: Recipient, title: string, content: string) => void
	onForward?: (recipients: Recipient[], title: string, content: string) => void
}

function MessageDisplay({ message, onClose, onToggleFavorite, onDelete, onReply, onForward }: MessageDisplayProps) {
	const { t, i18n } = useTranslation('inbox')
	const [expanded, setExpanded] = useState(false)
	const [hasOverflow, setHasOverflow] = useState(false)
	const [rowHeight, setRowHeight] = useState(0)
	const listRef = useRef<HTMLDivElement>(null)
	const [forwardOpen, setForwardOpen] = useState(false)
	const [forwardQuery, setForwardQuery] = useState("")
	const [forwardSelected, setForwardSelected] = useState<Recipient[]>([])

	const { user: currentUser } = useAuth()
	const { data: usersData } = useUsers({ q: forwardQuery, limit: 8 })
	const { data: groupsData } = useSearchGroups(forwardQuery)

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

	const forwardSelectedKeys = new Set(forwardSelected.map(r => `${r.isGroup ? "g" : "u"}${r.id}`))
	const forwardAvailable: Recipient[] = [
		...(usersData?.items ?? []).map(u => ({ id: u.id, name: u.display_name, isGroup: false })),
		...(groupsData ?? []).map(g => ({ id: g.id, name: g.name, isGroup: true }))
	].filter(r => !forwardSelectedKeys.has(`${r.isGroup ? "g" : "u"}${r.id}`) && (r.isGroup || r.id !== currentUser?.id))

	function openForward() {
		setForwardSelected([])
		setForwardQuery("")
		setForwardOpen(true)
	}

	function confirmForward() {
		if(forwardSelected.length === 0) return
		onForward?.(forwardSelected, message.title, message.content)
		setForwardOpen(false)
	}

	function handleReply() {
		onReply?.(
			{ id: message.sender.id, name: message.sender.display_name, isGroup: false },
			message.title,
			message.content
		)
	}

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
					<button onClick={handleReply}>
						<ArrowUturnLeftIcon />
						<span>{t('message.reply')}</span>
					</button>
					<button onClick={openForward}>
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
		{forwardOpen && (
			<Modal
				title={t("forward.title")}
				onClose={() => setForwardOpen(false)}
				footer={
					<>
						<Button buttonLevel={2} onClick={() => setForwardOpen(false)}>{t("schedule.cancel")}</Button>
						<Button buttonLevel={1} onClick={confirmForward} disabled={forwardSelected.length === 0}>{t("message.forward")}</Button>
					</>
				}
			>
				<div className="forward-modal">
					{forwardSelected.length > 0 && (
						<div className="forward-modal__selected">
							{forwardSelected.map(r => (
								<MessageRecipient key={`${r.isGroup ? "g" : "u"}${r.id}`} name={r.name} isGroup={r.isGroup}>
									<button
										className="forward-modal__remove"
										onClick={() => setForwardSelected(prev => prev.filter(x => !(x.id === r.id && x.isGroup === r.isGroup)))}
									>
										<XMarkIcon />
									</button>
								</MessageRecipient>
							))}
						</div>
					)}
					<div className="forward-modal__search">
						<MagnifyingGlassIcon />
						<input
							autoFocus
							placeholder={t("recipients.searchPlaceholder")}
							value={forwardQuery}
							onChange={e => setForwardQuery(e.target.value)}
						/>
					</div>
					<div className="forward-modal__list">
						{forwardAvailable.length === 0
							? <span className="forward-modal__empty">{t("recipients.allAdded")}</span>
							: forwardAvailable.map(r => (
								<div
									key={`${r.isGroup ? "g" : "u"}${r.id}`}
									className="forward-modal__item"
									onClick={() => setForwardSelected(prev => [...prev, r])}
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
			</Modal>
		)}
		</>
	)
}

export default MessageDisplay
