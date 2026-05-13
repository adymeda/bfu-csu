import "@styles/components/inbox/MessageCreate.scss"
import type { MessageCreateProps, Recipient } from "./types"
import { ChevronLeftIcon, GlobeAltIcon, MagnifyingGlassIcon, PaperAirplaneIcon, PaperClipIcon, PlusIcon, UsersIcon, XMarkIcon } from "@heroicons/react/24/outline"
import { useState } from "react"
import Dropdown from "@components/ui/Dropdown"
import Avatar from "@components/ui/Avatar"
import MessageRecipient from "./MessageRecipient"

const MOCK_RECIPIENTS: Recipient[] = [
    { id: "1", name: "Ишанов Сергей Александрович", isGroup: false },
    { id: "2", name: "Савкин Дмитрий Александрович", isGroup: false },
    { id: "3", name: "ПМ4 АДМО", isGroup: true },
    { id: "4", name: "Кулдышев Никита Андреевич", isGroup: false },
]

function MessageCreate({ onClose, onSend }: MessageCreateProps) {
    const [subject, setSubject] = useState("")
    const [body, setBody] = useState("")
    const [selected, setSelected] = useState<Recipient[]>([])
    const [attachments] = useState<string[]>([])

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
                    placeholder="Тема сообщения"
                    value={subject}
                    onChange={e => setSubject(e.target.value)} />
                <XMarkIcon className="message-create__header-close" onClick={onClose} />
            </div>

            <div className="message-create__content">
                <div className="message-create__text-area">
                    <div className="message-create__recipients">
                        <span className="message-create__recipients-label">Кому:</span>
                        <div className="message-create__recipients-list">
                            {selected.map(r => (
                                <MessageRecipient key={r.id} name={r.name} isGroup={r.isGroup}>
                                    <button className="message-create__recipient-remove"
                                      onClick={() => removeRecipient(r.id)}
                                      title="Удалить">
                                        <XMarkIcon />
                                    </button>
                                </MessageRecipient>
                            ))}
                        </div>
                        <Dropdown trigger={
                                <button className="message-create__add-button" title="Добавить получателя">
                                    <PlusIcon />
                                </button>
                        }>
                            <div className="message-create__recipients-dropdown">
                                <div className="message-create__recipients-dropdown-search">
                                    <MagnifyingGlassIcon />
                                    <input placeholder="Поиск получателя..." />
                                </div>
                                <div className="message-create__recipients-dropdown-list">
                                    {available.length === 0
                                    ? <span className="message-create__recipients-dropdown-empty">Все получатели добавлены</span>
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
                        placeholder="Текст сообщения..."
                        value={body}
                        onChange={e => setBody(e.target.value)}
                    />

                    <div className="message-create__footer">
                        <button className="message-create__send-button" onClick={handleSend}>
                            <PaperAirplaneIcon />
                            <span>Отправить</span>
                        </button>
                    </div>
                </div>

                <div className="message-create__attachments-area">
                    <div className="message-create__attachments-header">
                        <span className="message-create__attachments-title">Вложения</span>
                        <Dropdown
                            trigger={
                                <button className="message-create__add-button" title="Добавить вложение">
                                    <PlusIcon />
                                </button>
                            }
                        >
                            <div className="message-create__attachments-dropdown">
                                <div className="message-create__attachments-dropdown-item">
                                    <PaperClipIcon />
                                    <span>Добавить файл</span>
                                </div>
                                <div className="message-create__attachments-dropdown-item">
                                    <GlobeAltIcon />
                                    <span>Создать мероприятие</span>
                                </div>
                            </div>
                        </Dropdown>
                    </div>
                    {attachments.length === 0 && (
                        <span className="message-create__attachments-empty">
                            Пока что не добавлено ни одного вложения
                        </span>
                    )}
                </div>
            </div>
        </>
    )
}

export default MessageCreate
