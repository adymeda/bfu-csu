import clsx from "clsx"
import "@styles/components/management/UserListItem.scss"
import type { UserListItemProps } from "./types"
import Avatar from "@components/ui/Avatar"

function UserListItem({ user, selected = false, onClick }: UserListItemProps) {
    return (
        <div className={clsx("management-user", selected && "management-user--selected")} onClick={onClick}>
            <Avatar placeholder={user.display_name} color={`#${user.accent_color}`} />
            <span className="management-user__name">{user.display_name}</span>
        </div>
    )
}

export default UserListItem