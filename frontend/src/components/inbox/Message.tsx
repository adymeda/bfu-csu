import clsx from "clsx"
import "@styles/components/inbox/Message.scss"
import type { MessageProps } from "./types"
import Avatar from "@components/ui/Avatar"
import { MESSAGE_CATEGORY_LABELS } from "../../api/types"

function Message({ title, author, authorColor, authorIcon, isRead=false, selected=false, text, date, category, requiresResponse=false }: MessageProps) {
    return (
        <div className={clsx("message", !isRead && "message--unread", selected && "message--selected")}>
            <div className="message__header">
                <div className="message__author">
                    <Avatar image={authorIcon} color={authorColor} placeholder={author}/>
                    <span>{ author }</span>
                </div>
            </div>
            <div className="message__title">
                <span>{ title }</span>
                {requiresResponse && (
                    <div className="message__requires-response" title="Требуется ответ">!</div>
                )}
            </div>
            <div className="message__content">
                { text }
            </div>
            <div className="message__footer">
                {category && (
                    <span className="message__category">{MESSAGE_CATEGORY_LABELS[category] ?? category}</span>
                )}
                {date && <span className="message__date">{date}</span>}
            </div>
        </div>
    )
}

export default Message