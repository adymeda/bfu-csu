import "@styles/components/inbox/MessageRecipient.scss"
import type { MessageRecipientProps } from "./types"
import { UsersIcon } from "@heroicons/react/24/outline"
import Avatar from "@components/ui/Avatar"

function MessageRecipient({ name, isGroup, icon, color, children }: MessageRecipientProps) {
    return (
        <div className="message-recipient">
            {isGroup
                ? <UsersIcon />
                : <Avatar placeholder={name} image={icon} color={color} />
            }
            <span>{name}</span>
            {children}
        </div>
    )
}

export default MessageRecipient
