import "@styles/components/inbox/MessageAttachment.scss";
import type { ReactNode } from "react";

type MessageAttachmentProps = {
    name: string;
    description?: string;
    icon: ReactNode;
    action?: ReactNode;
    accentColor?: string;
    children?: ReactNode;
};

function MessageAttachment({ name, description, icon, action, accentColor, children }: MessageAttachmentProps) {
    return (
        <div className="message-attachment">
            <div className="message-attachment__main">
                <span className="message-attachment__icon">{icon}</span>
                <div className="message-attachment__info">
                    <span className="message-attachment__name">{name}</span>
                    {description && <span className="message-attachment__description">{description}</span>}
                </div>
                {action && <span className="message-attachment__action">{action}</span>}
            </div>
            {children && (
                <div
                    className="message-attachment__body"
                    style={{ borderLeftColor: accentColor }}>
                    {children}
                </div>
            )}
        </div>
    );
}

export default MessageAttachment;
export type { MessageAttachmentProps };
