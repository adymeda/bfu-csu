import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { ChevronLeftIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline"
import "@styles/components/management/GroupInfo.scss"
import type { GroupInfoProps } from "./types"
import Avatar from "@components/ui/Avatar"
import GroupMemberRow from "./GroupMemberRow"

function GroupInfo({ group, parentName, onClose, onToggleAdmin, onRemoveMember }: GroupInfoProps) {
    const { t } = useTranslation("management")
    const [search, setSearch] = useState("")

    const visibleMembers = useMemo(() => {
        const query = search.trim().toLowerCase()
        const filtered = query
            ? group.members.filter(m => m.display_name.toLowerCase().includes(query))
            : group.members.slice()
        return filtered.sort((a, b) => {
            if(a.isAdmin !== b.isAdmin) return a.isAdmin ? -1 : 1
            return a.display_name.localeCompare(b.display_name, "ru")
        })
    }, [group.members, search])

    return (
        <div className="group-info">
            <div className="group-info__header">
                <ChevronLeftIcon className="group-info__back" onClick={onClose} />
                <span className="group-info__header-title">{group.name}</span>
            </div>
            <div className="group-info__body">
                <div className="group-info__profile">
                    <Avatar placeholder={group.name} color="var(--accent-color)" />
                    <span className="group-info__name">{group.name}</span>
                </div>
                <div className="group-info__meta">
                    <div className="group-info__meta-row">
                        <span className="group-info__meta-label">{t("group.parent")}</span>
                        <span className="group-info__meta-value">{parentName ?? t("group.noParent")}</span>
                    </div>
                    <div className="group-info__meta-row">
                        <span className="group-info__meta-label">{t("group.membersTotal")}</span>
                        <span className="group-info__meta-value">{group.members.length}</span>
                    </div>
                </div>
                <div className="group-info__members">
                    <div className="group-info__members-search">
                        <MagnifyingGlassIcon />
                        <input
                            placeholder={t("group.searchMembers")}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    {visibleMembers.length === 0
                        ? <div className="group-info__members-empty">{t("group.empty")}</div>
                        : <div className="group-info__members-list">
                            {visibleMembers.map(m => (
                                <GroupMemberRow
                                    key={m.id}
                                    member={m}
                                    onToggleAdmin={() => onToggleAdmin(m.id)}
                                    onRemove={() => onRemoveMember(m.id)}
                                />
                            ))}
                        </div>
                    }
                </div>
            </div>
        </div>
    )
}

export default GroupInfo
