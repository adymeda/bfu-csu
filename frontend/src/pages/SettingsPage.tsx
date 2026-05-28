import "@styles/pages/SettingsPage.scss"
import { useState, useRef } from "react"
import flagRu from "@assets/langs/ru.webp"
import flagEn from "@assets/langs/en.webp"
import { useTranslation } from "react-i18next"
import clsx from "clsx"
import Avatar from "@components/ui/Avatar"
import Button from "@components/ui/Button"
import Checkbox from "@components/ui/Checkbox"
import AuthInput from "../components/auth/AuthInput"
import ExternalLinkCard from "../components/settings/ExternalLinkCard"
import { useAuth } from "../contexts/AuthContext"
import { useLinks, useLinkTelegram, useDeleteLink } from "../hooks/links"
import { useUpdateUser } from "../hooks/users"
import { TELEGRAM_LINK_TYPE } from "../api/links"
import type { ApiError } from "../api/types"

function SettingsPage() {
    const { t, i18n } = useTranslation("settings")
    const { user } = useAuth()

    const username = user?.display_name ?? ""
    const avatarColor = user ? "#" + user.accent_color : undefined

    const fileInputRef = useRef<HTMLInputElement>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)

    function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if(!file) return
        const url = URL.createObjectURL(file)
        setPreviewUrl(url)
    }

    // Password
    const [oldPassword, setOldPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [passwordError, setPasswordError] = useState<string | null>(null)
    const [passwordSuccess, setPasswordSuccess] = useState(false)
    const updateUser = useUpdateUser()

    function handlePasswordSave(e: React.FormEvent) {
        e.preventDefault()
        setPasswordSuccess(false)
        if(newPassword.length === 0) {
            setPasswordError(t("password.empty"))
            return
        }
        if(newPassword !== confirmPassword) {
            setPasswordError(t("password.mismatch"))
            return
        }
        if(!user) return
        updateUser.mutate({ id: user.id, data: { password: newPassword } }, {
            onSuccess: () => {
                setPasswordError(null)
                setPasswordSuccess(true)
                setOldPassword("")
                setNewPassword("")
                setConfirmPassword("")
            },
            onError: () => setPasswordError(t("password.error"))
        })
    }

    // Telegram link
    const { data: links } = useLinks()
    const linkTelegram = useLinkTelegram()
    const deleteLink = useDeleteLink()
    const tgLink = links?.find(l => l.link_type === TELEGRAM_LINK_TYPE)
    const tgLinked = tgLink ? `ID ${tgLink.link_value}` : null

    function telegramError(): string | null {
        if(!linkTelegram.isError) return null
        const status = (linkTelegram.error as unknown as ApiError).status
        if(status === 404) return t("telegram.errorInvalid")
        if(status === 410) return t("telegram.errorExpired")
        if(status === 503) return t("telegram.errorUnavailable")
        return t("telegram.errorGeneric")
    }

    // Telegram notification prefs
    const [tgImportant, setTgImportant] = useState(false)
    const [tgEventsDeadlines, setTgEventsDeadlines] = useState(false)
    const [tgRemind, setTgRemind] = useState(false)
    const [tgRemindDays, setTgRemindDays] = useState(1)
    const [tgAll, setTgAll] = useState(false)

    return (
        <div className="settings-page">
            <div className="settings-page__titlebar">
                <span className="settings-page__title">{t("navigation.settings", { ns: "common" })}</span>
            </div>
            <div className="settings-wrapper">
            <div className="settings">
            {/* Profile / Avatar */}
            <div className="settings__section">
                <span className="settings__section-title">{t("profile.title")}</span>
                <div className="settings__section-card">
                    <div className="settings__avatar-row">
                        <Avatar
                            image={previewUrl ?? undefined}
                            placeholder={username}
                            color={avatarColor}
                        />
                        <Button buttonLevel={2} onClick={() => fileInputRef.current?.click()}>
                            {t("profile.changeAvatar")}
                        </Button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            style={{ display: "none" }}
                            onChange={handleAvatarChange}
                        />
                    </div>
                </div>
            </div>

            {/* Password */}
            <div className="settings__section">
                <span className="settings__section-title">{t("password.title")}</span>
                <div className="settings__section-card">
                    <form className="settings__fields" onSubmit={handlePasswordSave}>
                        <AuthInput
                            name="old_password"
                            type="password"
                            placeholder={t("password.old")}
                            value={oldPassword}
                            onChange={e => setOldPassword(e.target.value)}
                        />
                        <AuthInput
                            name="new_password"
                            type="password"
                            placeholder={t("password.new")}
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                        />
                        <AuthInput
                            name="confirm_password"
                            type="password"
                            placeholder={t("password.confirm")}
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                        />
                        {passwordError && <span className="settings__error">{passwordError}</span>}
                        {passwordSuccess && <span className="settings__success">{t("password.success")}</span>}
                        <Button buttonType="submit" disabled={updateUser.isPending}>{t("password.save")}</Button>
                    </form>
                </div>
            </div>

            {/* Language */}
            <div className="settings__section">
                <span className="settings__section-title">{t("language.title")}</span>
                <div className="settings__section-card">
                    <div className="settings__lang-row">
                        <button
                            type="button"
                            className={clsx("settings__lang-btn", i18n.language === "ru" && "settings__lang-btn--active")}
                            onClick={() => i18n.changeLanguage("ru")}
                        >
                            <img src={flagRu} alt="ru" className="settings__lang-flag" />
                            {t("language.ru")}
                        </button>
                        <button
                            type="button"
                            className={clsx("settings__lang-btn", i18n.language === "en" && "settings__lang-btn--active")}
                            onClick={() => i18n.changeLanguage("en")}
                        >
                            <img src={flagEn} alt="en" className="settings__lang-flag" />
                            {t("language.en")}
                        </button>
                    </div>
                </div>
            </div>

            {/* External links */}
            <div className="settings__section">
                <span className="settings__section-title">{t("externalLinks.title")}</span>
                <ExternalLinkCard
                    icon="https://telegram.org/img/favicon.ico"
                    name="Telegram"
                    linkedValue={tgLinked ?? undefined}
                    inputPlaceholder={t("telegram.codePlaceholder")}
                    isLinking={linkTelegram.isPending}
                    error={telegramError()}
                    onLink={code => linkTelegram.mutate(code)}
                    onUnlink={() => deleteLink.mutate(TELEGRAM_LINK_TYPE)}
                >
                    <Checkbox
                        text={t("telegram.important")}
                        checked={tgImportant}
                        onChange={e => setTgImportant(e.target.checked)}
                    />
                    <Checkbox
                        text={t("telegram.eventsDeadlines")}
                        checked={tgEventsDeadlines}
                        onChange={e => setTgEventsDeadlines(e.target.checked)}
                    />
                    <div className="external-links__row">
                        <Checkbox
                            text={t("telegram.remindBefore")}
                            checked={tgRemind}
                            onChange={e => setTgRemind(e.target.checked)}
                        />
                        <select
                            disabled={!tgRemind}
                            value={tgRemindDays}
                            onChange={e => setTgRemindDays(Number(e.target.value))}
                        >
                            {[1, 2, 3, 4, 5, 6, 7].map(n => (
                                <option key={n} value={n}>{n}</option>
                            ))}
                        </select>
                        <span>{t("telegram.remindBeforeDays")}</span>
                    </div>
                    <Checkbox
                        text={t("telegram.allMessages")}
                        checked={tgAll}
                        onChange={e => setTgAll(e.target.checked)}
                    />
                </ExternalLinkCard>
            </div>
        </div>
            </div>
        </div>
    )
}

export default SettingsPage