import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { ChevronLeftIcon, MagnifyingGlassIcon, PencilSquareIcon, PlusIcon, TrashIcon, UserPlusIcon, XMarkIcon } from "@heroicons/react/24/outline"
import "@styles/components/management/GroupInfo.scss"
import type { GroupInfoProps, GroupMember } from "./types"
import Avatar from "@components/ui/Avatar"
import Button from "@components/ui/Button"
import Dropdown from "@components/ui/Dropdown"
import Modal from "@components/ui/Modal"
import GroupMemberRow from "./GroupMemberRow"
import { useUsers } from "../../hooks/users"

function GroupInfo({ group, parentName, onClose, onToggleAdmin, onRemoveMember, onAddMember, onRename, onDelete, onSetRole, onAddAlias, onRemoveAlias }: GroupInfoProps) {
    const { t } = useTranslation("management")
    const [search, setSearch] = useState("")
    const [renaming, setRenaming] = useState(false)
    const [nameDraft, setNameDraft] = useState(group.name)
    const [addQuery, setAddQuery] = useState("")

    const [addingAlias, setAddingAlias] = useState(false)
    const [aliasDraft, setAliasDraft] = useState("")

    const [roleEditing, setRoleEditing] = useState<GroupMember | null>(null)
    const [roleDraft, setRoleDraft] = useState("")

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

    function handleAliasSubmit() {
        const alias = aliasDraft.trim()
        if(!alias) return
        onAddAlias(alias)
        setAddingAlias(false)
        setAliasDraft("")
    }

    function handleRoleSubmit() {
        if(!roleEditing) return
        onSetRole(roleEditing.id, roleDraft)
        setRoleEditing(null)
        setRoleDraft("")
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
                    <div className="group-info__meta-row group-info__meta-row--column">
                        <span className="group-info__meta-label">{t("group.aliases")}</span>
                        <div className="group-info__aliases">
                            {group.aliases.map(alias => (
                                <span key={alias} className="group-info__alias-tag">
                                    <span className="group-info__alias-text">{alias}</span>
                                    <button
                                        className="group-info__alias-remove"
                                        onClick={() => onRemoveAlias(alias)}
                                        title={t("group.removeAlias")}
                                    >
                                        <XMarkIcon />
                                    </button>
                                </span>
                            ))}
                            <button
                                className="group-info__alias-add"
                                onClick={() => { setAliasDraft(""); setAddingAlias(true) }}
                                title={t("group.addAlias")}
                            >
                                <PlusIcon />
                            </button>
                        </div>
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
                                    onEditRole={() => { setRoleEditing(m); setRoleDraft(m.position ?? "") }}
                                />
                            ))}
                        </div>
                    }
                </div>
            </div>

            {addingAlias && (
                <Modal
                    title={t("group.aliasModalTitle")}
                    onClose={() => setAddingAlias(false)}
                    footer={
                        <>
                            <Button buttonLevel={2} onClick={() => setAddingAlias(false)}>
                                {t("group.cancel")}
                            </Button>
                            <Button
                                buttonLevel={1}
                                onClick={handleAliasSubmit}
                                disabled={aliasDraft.trim().length === 0}
                            >
                                {t("group.add")}
                            </Button>
                        </>
                    }
                >
                    <div className="management-create-group">
                        <label className="management-create-group__label">{t("group.aliasPlaceholder")}</label>
                        <input
                            className="management-create-group__input"
                            autoFocus
                            value={aliasDraft}
                            onChange={e => setAliasDraft(e.target.value)}
                            onKeyDown={e => { if(e.key === "Enter") handleAliasSubmit() }}
                        />
                    </div>
                </Modal>
            )}

            {roleEditing && (
                <Modal
                    title={t("group.roleModalTitle")}
                    onClose={() => setRoleEditing(null)}
                    footer={
                        <>
                            <Button buttonLevel={2} onClick={() => setRoleEditing(null)}>
                                {t("group.cancel")}
                            </Button>
                            <Button
                                buttonLevel={1}
                                onClick={handleRoleSubmit}
                            >
                                {t("group.save")}
                            </Button>
                        </>
                    }
                >
                    <div className="management-create-group">
                        <label className="management-create-group__label">{t("group.rolePlaceholder")}</label>
                        <input
                            className="management-create-group__input"
                            autoFocus
                            placeholder={t("group.roleEmptyHint")}
                            value={roleDraft}
                            onChange={e => setRoleDraft(e.target.value)}
                            onKeyDown={e => { if(e.key === "Enter") handleRoleSubmit() }}
                        />
                    </div>
                </Modal>
            )}
        </div>
    )
}

export default GroupInfo