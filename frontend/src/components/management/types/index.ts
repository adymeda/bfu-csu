import type { TreeNode } from "@components/ui/types"

export interface ManagementUser {
    id: number,
    display_name: string,
    accent_color: string,
    image?: string,
    groups: TreeNode[]
}

export interface UserListItemProps {
    user: ManagementUser,
    selected?: boolean,
    onClick?: () => void
}

export interface UserInfoProps {
    user: ManagementUser,
    onClose?: () => void
}

export interface GroupMember {
    id: number,
    display_name: string,
    isAdmin: boolean,
    image?: string,
    accent_color?: string
}

export interface ManagementGroup {
    id: number,
    name: string,
    parent_id: number | null,
    members: GroupMember[]
}

export interface GroupInfoProps {
    group: ManagementGroup,
    parentName: string | null,
    onClose?: () => void,
    onToggleAdmin: (memberId: number) => void,
    onRemoveMember: (memberId: number) => void
}

export interface GroupMemberRowProps {
    member: GroupMember,
    onToggleAdmin: () => void,
    onRemove: () => void
}