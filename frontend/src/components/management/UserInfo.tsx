import { useState } from "react"
import { useTranslation } from "react-i18next"
import { ChevronLeftIcon, PencilSquareIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline"
import "@styles/components/management/UserInfo.scss"
import type { UserInfoProps } from "./types"
import Avatar from "@components/ui/Avatar"

function UserInfo({ user, onClose, onRename, onDelete, onRemoveFromGroup, groupsLoading }: UserInfoProps) {
	const { t } = useTranslation("management")
	const [renaming, setRenaming] = useState(false)
	const [nameDraft, setNameDraft] = useState(user.display_name)

	function commitRename() {
		const next = nameDraft.trim()
		if(next.length > 0 && next !== user.display_name) onRename(next)
		setRenaming(false)
	}

	return (
		<div className="user-info">
			<div className="user-info__header">
				<ChevronLeftIcon className="user-info__back" onClick={onClose} />
				{renaming
					? <input
						className="user-info__rename-input"
						autoFocus
						value={nameDraft}
						onChange={e => setNameDraft(e.target.value)}
						onBlur={commitRename}
						onKeyDown={e => {
							if(e.key === "Enter") commitRename()
							else if(e.key === "Escape") { setNameDraft(user.display_name); setRenaming(false) }
						}}
					/>
					: <span className="user-info__header-title">{user.display_name}</span>
				}
				<div className="user-info__header-actions">
					<button
						className="user-info__header-action"
						title={t("user.rename")}
						onClick={() => { setNameDraft(user.display_name); setRenaming(true) }}
					>
						<PencilSquareIcon />
					</button>
					<button
						className="user-info__header-action user-info__header-action--danger"
						title={t("user.delete")}
						onClick={onDelete}
					>
						<TrashIcon />
					</button>
				</div>
			</div>
			<div className="user-info__body">
				<div className="user-info__profile">
					<Avatar placeholder={user.display_name} color={`#${user.accent_color}`} />
					<span className="user-info__name">{user.display_name}</span>
				</div>
				<div className="user-info__groups">
					<span className="user-info__groups-title">{t("groupsTitle")}</span>
					{groupsLoading
						? <div className="user-info__groups-empty">{t("loading")}</div>
						: user.groups.length === 0
							? <div className="user-info__groups-empty">{t("user.groupsEmpty")}</div>
							: user.groups.map(g => (
								<div key={g.id} className="user-info__group-row">
									<div className="user-info__group-info">
										<span className="user-info__group-name">{g.name}</span>
										{g.position && (
											<span className="user-info__group-position">{g.position}</span>
										)}
									</div>
									<button
										className="user-info__group-remove"
										title={t("user.removeFromGroup")}
										onClick={() => onRemoveFromGroup(g.id)}
									>
										<XMarkIcon />
									</button>
								</div>
							))
					}
				</div>
			</div>
		</div>
	)
}

export default UserInfo
