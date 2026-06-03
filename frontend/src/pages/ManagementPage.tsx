import clsx from "clsx"
import { useState, useEffect } from "react"
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
import Modal from "@components/ui/Modal"
import Button from "@components/ui/Button"
import UserListItem from "@components/management/UserListItem"
import UserInfo from "@components/management/UserInfo"
import GroupInfo from "@components/management/GroupInfo"
import type { ManagementGroup, ManagementUser, GroupMember } from "@components/management/types"
import { useUsers, useUserGroups, useCreateUser, useDeleteUser, useUpdateUser } from "../hooks/users"
import type { ApiError } from "../api/types"
import {
	useGroupTree, useGroup, useGroupMembers, useGroupAdmins,
	useCreateGroup, useUpdateGroup, useDeleteGroup,
	useAddGroupMember, useRemoveGroupMember, useAddGroupAdmin, useRemoveGroupAdmin,
	useAddGroupAlias, useRemoveGroupAlias, useSetGroupRole
} from "../hooks/groups"

type ActiveTab = "users" | "groups"

function ManagementPage() {
	const { t } = useTranslation("management")
	const [activeTab, setActiveTab] = useState<ActiveTab>("users")

	// Users tab state
	const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
	const [userSearch, setUserSearch] = useState("")
	const [isUserClosing, setIsUserClosing] = useState(false)
	const [creatingUser, setCreatingUser] = useState(false)
	const [newUserEmail, setNewUserEmail] = useState("")
	const [newUserPassword, setNewUserPassword] = useState("")
	const [newUserName, setNewUserName] = useState("")
	const [createUserError, setCreateUserError] = useState<string | null>(null)

	// Groups tab state
	const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)
	const [isGroupClosing, setIsGroupClosing] = useState(false)
	const [creating, setCreating] = useState<{ parentId: number | null } | null>(null)
	const [newGroupName, setNewGroupName] = useState("")

	const isUserContentOpen = selectedUserId !== null && !isUserClosing
	const isGroupContentOpen = selectedGroupId !== null && !isGroupClosing

	const usersQuery = useUsers({ q: userSearch.trim(), limit: 50 })
	const users = usersQuery.data?.items ?? []
	const selectedUserRaw = users.find(u => u.id === selectedUserId)

	const userGroupsQuery = useUserGroups(activeTab === "users" ? selectedUserId : null)
	const selectedUser: ManagementUser | undefined = selectedUserRaw
		? {
			id: selectedUserRaw.id,
			display_name: selectedUserRaw.display_name,
			accent_color: selectedUserRaw.accent_color,
			groups: (userGroupsQuery.data ?? []).map(g => ({ id: g.id, name: g.name, position: g.position ?? null }))
		}
		: undefined

	const groupTreeQuery = useGroupTree()
	const groupTree = groupTreeQuery.data?.tree ?? []
	const groupsFlat = groupTreeQuery.data?.groups ?? []

	const groupDetailQuery = useGroup(activeTab === "groups" ? selectedGroupId : null)
	const membersQuery = useGroupMembers(activeTab === "groups" ? selectedGroupId : null)
	const adminsQuery = useGroupAdmins(activeTab === "groups" ? selectedGroupId : null)

	const createUser = useCreateUser()
	const deleteUser = useDeleteUser()
	const updateUser = useUpdateUser()
	const createGroup = useCreateGroup()
	const updateGroup = useUpdateGroup()
	const deleteGroup = useDeleteGroup()
	const addMember = useAddGroupMember()
	const removeMember = useRemoveGroupMember()
	const addAdmin = useAddGroupAdmin()
	const removeAdmin = useRemoveGroupAdmin()
	const addAlias = useAddGroupAlias()
	const removeAlias = useRemoveGroupAlias()
	const setRole = useSetGroupRole()

	const selectedGroupRaw = groupsFlat.find(g => g.id === selectedGroupId)
	const parentName = selectedGroupRaw && selectedGroupRaw.parent_id !== null
		? groupsFlat.find(g => g.id === selectedGroupRaw.parent_id)?.name ?? null
		: null

	const selectedGroup: ManagementGroup | undefined = (() => {
		if(!selectedGroupRaw) return undefined
		const adminIds = new Set((adminsQuery.data ?? []).map(a => a.user_id))
		const members: GroupMember[] = (membersQuery.data ?? []).map(m => ({
			id: m.id,
			display_name: m.display_name,
			accent_color: m.accent_color,
			isAdmin: adminIds.has(m.id),
			position: m.position ?? null
		}))
		for(const a of adminsQuery.data ?? []) {
			if(!members.some(m => m.id === a.user_id)) {
				members.push({ id: a.user_id, display_name: a.display_name, accent_color: a.accent_color, isAdmin: true, position: null })
			}
		}
		return {
			id: selectedGroupRaw.id,
			name: selectedGroupRaw.name,
			parent_id: selectedGroupRaw.parent_id,
			aliases: groupDetailQuery.data?.aliases ?? [],
			members
		}
	})()

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

	function handleOpenCreateUser() {
		setNewUserEmail("")
		setNewUserPassword("")
		setNewUserName("")
		setCreateUserError(null)
		setCreatingUser(true)
	}

	function handleCreateUserSubmit() {
		const email = newUserEmail.trim()
		const password = newUserPassword
		const display_name = newUserName.trim()
		if(!email || !password || !display_name) return
		setCreateUserError(null)
		createUser.mutate({ email, password, display_name }, {
			onSuccess: user => {
				setCreatingUser(false)
				setSelectedUserId(user.id)
			},
			onError: err => {
				const apiErr = err as ApiError
				if(apiErr.status === 409) setCreateUserError(t("user.emailTaken"))
				else setCreateUserError(t("user.createError"))
			}
		})
	}

	function handleRenameUser(name: string) {
		if(selectedUserId === null) return
		updateUser.mutate({ id: selectedUserId, data: { display_name: name } })
	}

	function handleDeleteUser() {
		if(selectedUserId === null) return
		deleteUser.mutate(selectedUserId, { onSuccess: handleUserClose })
	}

	function handleRemoveUserFromGroup(groupId: number) {
		if(selectedUserId === null) return
		removeMember.mutate({ groupId, userId: selectedUserId })
	}

	function handleCreateRoot() {
		setNewGroupName("")
		setCreating({ parentId: null })
	}

	function handleCreateChild() {
		if(selectedGroupId === null) return
		setNewGroupName("")
		setCreating({ parentId: selectedGroupId })
	}

	function handleCreateSubmit() {
		const name = newGroupName.trim()
		if(!name || creating === null) return
		const parentId = creating.parentId
		setCreating(null)
		createGroup.mutate({ name, parentId }, {
			onSuccess: created => setSelectedGroupId(created.id)
		})
	}

	function handleToggleAdmin(memberId: number) {
		if(selectedGroupId === null || !selectedGroup) return
		const member = selectedGroup.members.find(m => m.id === memberId)
		if(!member) return
		if(member.isAdmin) removeAdmin.mutate({ groupId: selectedGroupId, userId: memberId })
		else addAdmin.mutate({ groupId: selectedGroupId, userId: memberId })
	}

	function handleRemoveMember(memberId: number) {
		if(selectedGroupId === null) return
		removeMember.mutate({ groupId: selectedGroupId, userId: memberId })
	}

	function handleAddMember(userId: number) {
		if(selectedGroupId === null) return
		addMember.mutate({ groupId: selectedGroupId, userId })
	}

	function handleRename(name: string) {
		if(selectedGroupId === null) return
		updateGroup.mutate({ id: selectedGroupId, data: { name } })
	}

	function handleDeleteGroup() {
		if(selectedGroupId === null) return
		deleteGroup.mutate(selectedGroupId, { onSuccess: handleGroupClose })
	}

	function handleSetRole(memberId: number, position: string) {
		if(selectedGroupId === null) return
		setRole.mutate({ groupId: selectedGroupId, userId: memberId, position })
	}

	function handleAddAlias(alias: string) {
		if(selectedGroupId === null) return
		addAlias.mutate({ groupId: selectedGroupId, alias })
	}

	function handleRemoveAlias(alias: string) {
		if(selectedGroupId === null) return
		removeAlias.mutate({ groupId: selectedGroupId, alias })
	}

	useEffect(() => {
		function onKeyDown(e: KeyboardEvent) {
			if(e.key !== "Escape") return
			if(activeTab === "users" && selectedUserId !== null) handleUserClose()
			else if(activeTab === "groups" && selectedGroupId !== null) handleGroupClose()
		}
		document.addEventListener("keydown", onKeyDown)
		return () => document.removeEventListener("keydown", onKeyDown)
	}, [activeTab, selectedUserId, selectedGroupId, isUserClosing, isGroupClosing])

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
							<button
								className="management-users-sidebar__create"
								onClick={handleOpenCreateUser}
								title={t("user.create")}
							>
								<PlusIcon />
							</button>
						</div>
						<div className="management-users-sidebar__list">
							{usersQuery.isLoading && (
								<div className="management-users-sidebar__empty">{t("loading")}</div>
							)}
							{!usersQuery.isLoading && users.length === 0 && (
								<div className="management-users-sidebar__empty">{t("noUsers")}</div>
							)}
							{users.map(u => (
								<UserListItem
									key={u.id}
									user={{ id: u.id, display_name: u.display_name, accent_color: u.accent_color, groups: [] }}
									selected={selectedUserId === u.id}
									onClick={() => setSelectedUserId(u.id)}
								/>
							))}
						</div>
					</div>
					<div className={clsx("management-users-content", isUserContentOpen && "management-users-content--active")}>
						{selectedUser
							? <UserInfo
								user={selectedUser}
								onClose={handleUserClose}
								onRename={handleRenameUser}
								onDelete={handleDeleteUser}
								onRemoveFromGroup={handleRemoveUserFromGroup}
								groupsLoading={userGroupsQuery.isLoading}
							/>
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
								onAddMember={handleAddMember}
								onRename={handleRename}
								onDelete={handleDeleteGroup}
								onSetRole={handleSetRole}
								onAddAlias={handleAddAlias}
								onRemoveAlias={handleRemoveAlias}
							/>
							: <div className="management-groups-content__empty">
								<UserGroupIcon />
								<span>{t("group.select")}</span>
							</div>}
					</div>
				</div>}
			{creatingUser && (
				<Modal
					title={t("user.createTitle")}
					onClose={() => setCreatingUser(false)}
					footer={
						<>
							<Button buttonLevel={2} onClick={() => setCreatingUser(false)}>
								{t("user.cancel")}
							</Button>
							<Button
								buttonLevel={1}
								onClick={handleCreateUserSubmit}
								disabled={
									newUserEmail.trim().length === 0 ||
									newUserPassword.length === 0 ||
									newUserName.trim().length === 0 ||
									createUser.isPending
								}
							>
								{t("user.add")}
							</Button>
						</>
					}
				>
					<div className="management-create-group">
						<label className="management-create-group__label">{t("user.name")}</label>
						<input
							className="management-create-group__input"
							autoFocus
							value={newUserName}
							onChange={e => setNewUserName(e.target.value)}
							onKeyDown={e => { if(e.key === "Enter") handleCreateUserSubmit() }}
						/>
					</div>
					<div className="management-create-group">
						<label className="management-create-group__label">{t("user.email")}</label>
						<input
							className="management-create-group__input"
							type="email"
							value={newUserEmail}
							onChange={e => { setNewUserEmail(e.target.value); setCreateUserError(null) }}
							onKeyDown={e => { if(e.key === "Enter") handleCreateUserSubmit() }}
						/>
					</div>
					<div className="management-create-group">
						<label className="management-create-group__label">{t("user.password")}</label>
						<input
							className="management-create-group__input"
							type="password"
							value={newUserPassword}
							onChange={e => setNewUserPassword(e.target.value)}
							onKeyDown={e => { if(e.key === "Enter") handleCreateUserSubmit() }}
						/>
					</div>
					{createUserError && (
						<span className="management-create-user__error">{createUserError}</span>
					)}
				</Modal>
			)}
			{creating && (
				<Modal
					title={creating.parentId === null ? t("group.createModalTitle") : t("group.createChildModalTitle")}
					onClose={() => setCreating(null)}
					footer={
						<>
							<Button buttonLevel={2} onClick={() => setCreating(null)}>
								{t("group.cancel")}
							</Button>
							<Button
								buttonLevel={1}
								onClick={handleCreateSubmit}
								disabled={newGroupName.trim().length === 0 || createGroup.isPending}
							>
								{t("group.create")}
							</Button>
						</>
					}
				>
					<div className="management-create-group">
						<label className="management-create-group__label">{t("group.namePlaceholder")}</label>
						<input
							className="management-create-group__input"
							autoFocus
							value={newGroupName}
							onChange={e => setNewGroupName(e.target.value)}
							onKeyDown={e => { if(e.key === "Enter") handleCreateSubmit() }}
						/>
					</div>
				</Modal>
			)}
		</div>
	)
}

export default ManagementPage
