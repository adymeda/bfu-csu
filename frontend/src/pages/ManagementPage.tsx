import clsx from "clsx"
import { useState, useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import {
    UserGroupIcon,
    MagnifyingGlassIcon,
    PlusIcon,
    FolderPlusIcon
} from "@heroicons/react/24/outline"
import "@styles/pages/ManagementPage.scss"
import Tabs from "@components/ui/Tabs"
import Tree from "@components/ui/Tree"
import UserListItem from "@components/management/UserListItem"
import UserInfo from "@components/management/UserInfo"
import GroupInfo from "@components/management/GroupInfo"
import { MOCK_USERS, MOCK_GROUPS } from "@components/management/mock"
import type { ManagementGroup } from "@components/management/types"
import type { TreeNode } from "@components/ui/types"

type ActiveTab = "users" | "groups"

function buildGroupTree(groups: ManagementGroup[]): TreeNode[] {
    const byParent = new Map<number | null, ManagementGroup[]>()
    for(const g of groups) {
        const list = byParent.get(g.parent_id) ?? []
        list.push(g)
        byParent.set(g.parent_id, list)
    }
    function build(parentId: number | null): TreeNode[] {
        const list = byParent.get(parentId) ?? []
        return list.map(g => ({
            id: g.id,
            label: g.name,
            children: build(g.id)
        }))
    }
    return build(null)
}

function ManagementPage() {
    const { t } = useTranslation("management")
    const [activeTab, setActiveTab] = useState<ActiveTab>("users")

    // Users tab state
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
    const [userSearch, setUserSearch] = useState("")
    const [isUserClosing, setIsUserClosing] = useState(false)

    // Groups tab state
    const [groups, setGroups] = useState<ManagementGroup[]>(MOCK_GROUPS)
    const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)
    const [isGroupClosing, setIsGroupClosing] = useState(false)
    const [creating, setCreating] = useState<{ parentId: number | null } | null>(null)

    const isUserContentOpen = selectedUserId !== null && !isUserClosing
    const isGroupContentOpen = selectedGroupId !== null && !isGroupClosing

    const filteredUsers = MOCK_USERS.filter(u =>
        u.display_name.toLowerCase().includes(userSearch.trim().toLowerCase())
    )
    const selectedUser = MOCK_USERS.find(u => u.id === selectedUserId)

    const groupTree = useMemo(() => buildGroupTree(groups), [groups])
    const selectedGroup = groups.find(g => g.id === selectedGroupId)
    const parentName = selectedGroup
        ? (selectedGroup.parent_id !== null
            ? groups.find(g => g.id === selectedGroup.parent_id)?.name ?? null
            : null)
        : null

    function handleUserClose() {
        if(window.matchMedia("(max-width: 768px)").matches) {
            setIsUserClosing(true)
            setTimeout(() => {
                setSelectedUserId(null)
                setIsUserClosing(false)
            }, 250)
        } else {
            setSelectedUserId(null)
        }
    }

    function handleGroupClose() {
        if(window.matchMedia("(max-width: 768px)").matches) {
            setIsGroupClosing(true)
            setTimeout(() => {
                setSelectedGroupId(null)
                setIsGroupClosing(false)
            }, 250)
        } else {
            setSelectedGroupId(null)
        }
    }

    function handleCreateRoot() {
        setCreating({ parentId: null })
    }

    function handleCreateChild() {
        if(selectedGroupId === null) return
        setCreating({ parentId: selectedGroupId })
    }

    function commitCreate(rawName: string) {
        const name = rawName.trim()
        if(creating === null) return
        if(!name) {
            setCreating(null)
            return
        }
        const nextId = groups.reduce((max, g) => Math.max(max, g.id), 0) + 1
        const newGroup: ManagementGroup = {
            id: nextId,
            name,
            parent_id: creating.parentId,
            members: []
        }
        setGroups([...groups, newGroup])
        setSelectedGroupId(nextId)
        setCreating(null)
    }

    function handleToggleAdmin(memberId: number) {
        if(selectedGroupId === null) return
        setGroups(groups.map(g => {
            if(g.id !== selectedGroupId) return g
            return {
                ...g,
                members: g.members.map(m =>
                    m.id === memberId ? { ...m, isAdmin: !m.isAdmin } : m
                )
            }
        }))
    }

    function handleRemoveMember(memberId: number) {
        if(selectedGroupId === null) return
        setGroups(groups.map(g => {
            if(g.id !== selectedGroupId) return g
            return { ...g, members: g.members.filter(m => m.id !== memberId) }
        }))
    }

    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            if(e.key !== "Escape") return
            if(creating !== null) {
                setCreating(null)
                return
            }
            if(activeTab === "users" && selectedUserId !== null) handleUserClose()
            else if(activeTab === "groups" && selectedGroupId !== null) handleGroupClose()
        }
        document.addEventListener("keydown", onKeyDown)
        return () => document.removeEventListener("keydown", onKeyDown)
    }, [activeTab, selectedUserId, selectedGroupId, isUserClosing, isGroupClosing, creating])

    return (
        <div className="management">
            <Tabs
                tabs={[
                    { key: "users", label: t("tabs.users") },
                    { key: "groups", label: t("tabs.groups") }
                ]}
                activeKey={activeTab}
                onChange={k => setActiveTab(k as ActiveTab)}
            />
            {activeTab === "users"
                ? <div className="management-users">
                    <div className="management-users-sidebar">
                        <div className="management-users-sidebar__search">
                            <MagnifyingGlassIcon />
                            <input
                                placeholder={t("searchPlaceholder")}
                                value={userSearch}
                                onChange={e => setUserSearch(e.target.value)}
                            />
                        </div>
                        <div className="management-users-sidebar__list">
                            {filteredUsers.map(u => (
                                <UserListItem
                                    key={u.id}
                                    user={u}
                                    selected={selectedUserId === u.id}
                                    onClick={() => setSelectedUserId(u.id)}
                                />
                            ))}
                        </div>
                    </div>
                    <div className={clsx("management-users-content", isUserContentOpen && "management-users-content--active")}>
                        {selectedUser
                            ? <UserInfo user={selectedUser} onClose={handleUserClose} />
                            : <div className="management-users-content__empty">
                                <UserGroupIcon />
                                <span>{t("selectUser")}</span>
                            </div>}
                    </div>
                </div>
                : <div className="management-groups">
                    <div className="management-groups-sidebar">
                        <div className="management-groups-sidebar__toolbar">
                            <button
                                className="management-groups-sidebar__action"
                                onClick={handleCreateRoot}
                                title={t("group.createRoot")}
                            >
                                <PlusIcon />
                            </button>
                            <button
                                className="management-groups-sidebar__action"
                                onClick={handleCreateChild}
                                disabled={selectedGroupId === null}
                                title={t("group.createChild")}
                            >
                                <FolderPlusIcon />
                            </button>
                        </div>
                        <div className="management-groups-sidebar__list">
                            {creating && (
                                <input
                                    className="management-groups-sidebar__new"
                                    autoFocus
                                    placeholder={t("group.namePlaceholder")}
                                    onKeyDown={e => {
                                        if(e.key === "Enter") commitCreate(e.currentTarget.value)
                                        else if(e.key === "Escape") setCreating(null)
                                    }}
                                    onBlur={e => commitCreate(e.currentTarget.value)}
                                />
                            )}
                            <Tree
                                nodes={groupTree}
                                selectedId={selectedGroupId ?? undefined}
                                onSelect={n => setSelectedGroupId(Number(n.id))}
                            />
                        </div>
                    </div>
                    <div className={clsx("management-groups-content", isGroupContentOpen && "management-groups-content--active")}>
                        {selectedGroup
                            ? <GroupInfo
                                group={selectedGroup}
                                parentName={parentName}
                                onClose={handleGroupClose}
                                onToggleAdmin={handleToggleAdmin}
                                onRemoveMember={handleRemoveMember}
                            />
                            : <div className="management-groups-content__empty">
                                <UserGroupIcon />
                                <span>{t("group.select")}</span>
                            </div>}
                    </div>
                </div>}
        </div>
    )
}

export default ManagementPage
