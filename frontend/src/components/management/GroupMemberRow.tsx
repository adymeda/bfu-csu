import { useTranslation } from "react-i18next"
import { EllipsisVerticalIcon } from "@heroicons/react/24/outline"
import { StarIcon } from "@heroicons/react/24/solid"
import "@styles/components/management/GroupMemberRow.scss"
import type { GroupMemberRowProps } from "./types"
import Avatar from "@components/ui/Avatar"
import Dropdown from "@components/ui/Dropdown"

function GroupMemberRow({ member, onToggleAdmin, onRemove }: GroupMemberRowProps) {
    const { t } = useTranslation("management")

    return (
        <div className="group-member-row">
            <Avatar
                placeholder={member.display_name}
                color={member.accent_color ? `#${member.accent_color}` : "var(--accent-color)"}
                image={member.image}
            />
            <span className="group-member-row__name">{member.display_name}</span>
            {member.isAdmin && <StarIcon className="group-member-row__admin" />}
            <Dropdown
                triggerClassName="group-member-row__menu-trigger"
                trigger={
                    <button className="group-member-row__menu-button">
                        <EllipsisVerticalIcon />
                    </button>
                }
            >
                <div className="group-member-row__menu">
                    <div className="group-member-row__menu-item" onClick={onToggleAdmin}>
                        {member.isAdmin ? t("group.revokeAdmin") : t("group.makeAdmin")}
                    </div>
                    <div className="group-member-row__menu-item group-member-row__menu-item--danger" onClick={onRemove}>
                        {t("group.removeFromGroup")}
                    </div>
                </div>
            </Dropdown>
        </div>
    )
}

export default GroupMemberRow
