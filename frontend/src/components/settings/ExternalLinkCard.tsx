import "@styles/components/settings/ExternalLinkCard.scss"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { XMarkIcon } from "@heroicons/react/24/outline"
import Button from "../ui/Button"
import type { ExternalLinkCardProps } from "./types"

function ExternalLinkCard({ icon, name, linkedValue, inputPlaceholder, onLink, onUnlink, isLinking, error, children }: ExternalLinkCardProps) {
    const { t } = useTranslation("settings")
    const [entering, setEntering] = useState(false)
    const [code, setCode] = useState("")

    // Collapse the input once linking succeeds.
    useEffect(() => {
        if(linkedValue) {
            setEntering(false)
            setCode("")
        }
    }, [linkedValue])

    function submit() {
        if(code.trim().length === 0) return
        onLink?.(code.trim())
    }

    return (
        <div className="external-links">
            <div className="external-links__header">
                <img className="external-links__icon" src={icon} alt={name} />
                <span className="external-links__name">{name}</span>
                {linkedValue
                    ? <div className="external-links__linked">
                        <span className="external-links__value">{linkedValue}</span>
                        {onUnlink && (
                            <button className="external-links__unlink" onClick={onUnlink}>
                                <XMarkIcon />
                            </button>
                        )}
                    </div>
                    : entering
                    ? <div className="external-links__form">
                        <input
                            className="external-links__input"
                            autoFocus
                            placeholder={inputPlaceholder ?? t("link")}
                            value={code}
                            onChange={e => setCode(e.target.value)}
                            onKeyDown={e => {
                                if(e.key === "Enter") submit()
                                else if(e.key === "Escape") setEntering(false)
                            }}
                        />
                        <Button buttonLevel={1} onClick={submit} disabled={isLinking || code.trim().length === 0}>
                            {t("linkConfirm")}
                        </Button>
                        <Button buttonLevel={2} onClick={() => setEntering(false)}>
                            {t("linkCancel")}
                        </Button>
                    </div>
                    : <Button buttonLevel={2} onClick={() => setEntering(true)}>{t("link")}</Button>
                }
            </div>
            {entering && error && (
                <span className="external-links__error">{error}</span>
            )}
            {children && (
                <div className="external-links__body">
                    {children}
                </div>
            )}
        </div>
    )
}

export default ExternalLinkCard
