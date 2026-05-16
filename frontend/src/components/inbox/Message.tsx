import clsx from "clsx"
import "@styles/components/inbox/Message.scss"
import type { MessageProps } from "./types"
import Avatar from "@components/ui/Avatar"

function Message({ title, author, authorColor, authorIcon, isRead=false, selected=false, text }: MessageProps) {
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
            </div>
            <div className="message__content">
                { text }
            </div>
            <div className="message__date">Сегодня в 18:35</div>
        </div>
    )
}

export default Message