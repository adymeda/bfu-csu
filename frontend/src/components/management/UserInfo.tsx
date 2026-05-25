import { useTranslation } from "react-i18next"
import { ChevronLeftIcon } from "@heroicons/react/24/outline"
import "@styles/components/management/UserInfo.scss"
import type { UserInfoProps } from "./types"
import Avatar from "@components/ui/Avatar"
import Tree from "@components/ui/Tree"

function UserInfo({ user, onClose }: UserInfoProps) {
    const { t } = useTranslation("management")

    return (
        <div className="user-info">
            <div className="user-info__header">
                <ChevronLeftIcon className="user-info__back" onClick={onClose} />
                <span className="user-info__header-title">{user.display_name}</span>
            </div>
            <div className="user-info__body">
                <div className="user-info__profile">
                    <Avatar placeholder={user.display_name} color={`#${user.accent_color}`} />
                    <span className="user-info__name">{user.display_name}</span>
                </div>
                <div className="user-info__groups">
                    <span className="user-info__groups-title">{t("groupsTitle")}</span>
                    <Tree nodes={user.groups} />
                </div>
            </div>
        </div>
    )
}

export default UserInfo