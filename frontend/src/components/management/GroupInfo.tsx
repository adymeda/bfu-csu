import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { ChevronLeftIcon, MagnifyingGlassIcon, PencilSquareIcon, TrashIcon, UserPlusIcon } from "@heroicons/react/24/outline"
import "@styles/components/management/GroupInfo.scss"
import type { GroupInfoProps } from "./types"
import Avatar from "@components/ui/Avatar"
import Dropdown from "@components/ui/Dropdown"
import GroupMemberRow from "./GroupMemberRow"
import { useUsers } from "../../hooks/users"

function GroupInfo({ group, parentName, onClose, onToggleAdmin, onRemoveMember, onAddMember, onRename, onDelete }: GroupInfoProps) {
    const { t } = useTranslation("management")
    const [search, setSearch] = useState("")
    const [renaming, setRenaming] = useState(false)
    const [nameDraft, setNameDraft] = useState(group.name)
    const [addQuery, setAddQuery] = useState("")

    const { data: usersData } = useUsers({ q: addQuery, limit: 8 })
    const memberIds = new Set(group.members.map(m => m.id))
    const addCandidates = (usersData?.items ?? []).filter(u => !memberIds.has(u.id))

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

    function commitRename() {
        const next = nameDraft.trim()
        if(next.length > 0 && next !== group.name) onRename(next)
        setRenaming(false)
    }

    return (
        <div className="group-info">
            <div className="group-info__header">
                <ChevronLeftIcon className="group-info__back" onClick={onClose} />
                {renaming
                    ? <input
                        className="group-info__rename-input"
                        autoFocus
                        value={nameDraft}
                        onChange={e => setNameDraft(e.target.value)}
                        onBlur={commitRename}
                        onKeyDown={e => {
                            if(e.key === "Enter") commitRename()
                            else if(e.key === "Escape") { setNameDraft(group.name); setRenaming(false) }
                        }}
                    />
                    : <span className="group-info__header-title">{group.name}</span>
                }
                <div className="group-info__header-actions">
                    <button className="group-info__header-action" title={t("group.rename")} onClick={() => { setNameDraft(group.name); setRenaming(true) }}>
                        <PencilSquareIcon />
                    </button>
                    <button className="group-info__header-action group-info__header-action--danger" title={t("group.delete")} onClick={onDelete}>
                        <TrashIcon />
                    </button>
                </div>
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
                    <div className="group-info__members-toolbar">
                        <div className="group-info__members-search">
                            <MagnifyingGlassIcon />
                            <input
                                placeholder={t("group.searchMembers")}
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <Dropdown trigger={
                            <button className="group-info__add-member" title={t("group.addMember")}>
                                <UserPlusIcon />
                            </button>
                        }>
                            <div className="group-info__add-dropdown">
                                <div className="group-info__add-search">
                                    <MagnifyingGlassIcon />
                                    <input
                                        placeholder={t("group.addMemberSearch")}
                                        value={addQuery}
                                        onChange={e => setAddQuery(e.target.value)}
                                    />
                                </div>
                                <div className="group-info__add-list">
                                    {addCandidates.length === 0
                                        ? <span className="group-info__add-empty">{t("group.addMemberEmpty")}</span>
                                        : addCandidates.map(u => (
                                            <div
                                                key={u.id}
                                                className="group-info__add-item"
                                                onClick={() => onAddMember(u.id)}
                                            >
                                                <Avatar placeholder={u.display_name} color={`#${u.accent_color}`} />
                                                <span>{u.display_name}</span>
                                            </div>
                                        ))
                                    }
                                </div>
                            </div>
                        </Dropdown>
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
