import clsx from "clsx"
import "@styles/components/inbox/MessageDisplay.scss"
import type { MessageProps } from "./types";
import { ArrowDownTrayIcon, ArrowTurnUpRightIcon, ArrowUpRightIcon, ArrowUturnLeftIcon, ChevronDownIcon, ChevronLeftIcon, ClipboardDocumentListIcon, EllipsisVerticalIcon, GlobeAltIcon, PaperClipIcon, StarIcon, XMarkIcon } from "@heroicons/react/24/outline";
import Avatar from "@components/ui/Avatar";
import MessageRecipient from "./MessageRecipient";
import MessageAttachment from "./MessageAttachment";
import { useLayoutEffect, useRef, useState } from "react";

function MessageDisplay({ title, text, onClose }: MessageProps) {
    const [expanded, setExpanded] = useState(false);
    const [hasOverflow, setHasOverflow] = useState(false);
    const [rowHeight, setRowHeight] = useState(0);
    const listRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        const el = listRef.current;
        if (!el) return;

        const firstChild = el.firstElementChild as HTMLElement | null;
        if (!firstChild) return;

        const h = firstChild.offsetHeight;
        setRowHeight(h);
        setHasOverflow(el.scrollHeight > h + 2);
    }, []);

    return (
        <>
        <div className="message-display__header">
            <ChevronLeftIcon className="message-display__header-back" onClick={onClose} />
            <div className="message-display__header-info">
                <div className="message-display__header-title">
                    {title}
                </div>
                <div className="message-display__header-author">
                    <Avatar placeholder="Ишанов Сергей Александрович"/>
                    <span>Ишанов Сергей Александрович</span>
                </div>
            </div>
            <div className="message-display__header-time">
                Сегодня в 18:35
            </div>
            <div className="message-display__header-buttons">
                <StarIcon />
                <EllipsisVerticalIcon />
                <XMarkIcon className="message-display__header-close" onClick={onClose} />
            </div>
        </div>
        <div className="message-display__content">
            <div className="message-display__text-area">
                <div className="message-display__text-recipients">
                    <span>Кому:</span>
                    <div ref={listRef}
                        className="message-display__text-recipients-list"
                        style={{ maxHeight: expanded ? undefined : rowHeight || undefined }}>
                        {Array.from({ length: 30 }, (_, i) => {
                            return (
                                <MessageRecipient name={`Test ${i + 1}`} isGroup={i === 1} />
                            );
                        })}
                    </div>
                    {hasOverflow && (
                        <button
                            className={clsx("message-display__text-recipients-extend", expanded && "expanded")}
                            onClick={() => setExpanded(v => !v)}>
                            <ChevronDownIcon />
                        </button>
                    )}
                </div>

                <div className="message-display__text-content">
                    { text }
                </div>

                <div className="message-display__text-area-buttons">
                    <button>
                        <ArrowUturnLeftIcon />
                        <span>Ответить</span>
                    </button>
                    <button>
                        <ArrowTurnUpRightIcon />
                        <span>Переслать</span>
                    </button>
                    <button>
                        <ArrowUpRightIcon />
                        <span>Ответить всем</span>
                    </button>
                    <button>
                        <ClipboardDocumentListIcon />
                        <span>Скопировать текст</span>
                    </button>
                </div>
            </div>

            <div className="message-display__attachments-area">
                <div className="message-display__attachments-area-title">Вложения</div>
                <MessageAttachment
                    icon={<PaperClipIcon />}
                    name="Учебный план 2025-2026.pdf"
                    description="1.2 МБ"
                    action={<button title="Скачать"><ArrowDownTrayIcon /></button>}
                />
                <MessageAttachment
                    icon={<PaperClipIcon />}
                    name="Расписание_весна.xlsx"
                    description="345 КБ"
                    action={<button title="Скачать"><ArrowDownTrayIcon /></button>}
                />
                <MessageAttachment
                    icon={<GlobeAltIcon />}
                    name="Установочная лекция"
                    description="15 мая 2026, 10:00 – 11:30"
                    accentColor="#e05c5c"
                >
                    Ауд. 214. Обязательное присутствие для всех студентов первого курса.
                </MessageAttachment>
                <MessageAttachment
                    icon={<GlobeAltIcon />}
                    name="Консультация по курсовой"
                    description="18 мая 2026, 14:00 – 15:00"
                    accentColor="#4a90d9">
                    Онлайн, ссылка будет отправлена дополнительно.
                </MessageAttachment>
            </div>
        </div>
        </>
    )
}

export default MessageDisplay