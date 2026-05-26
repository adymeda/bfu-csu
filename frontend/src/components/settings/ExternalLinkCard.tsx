import "@styles/components/settings/ExternalLinkCard.scss"
import { useTranslation } from "react-i18next"
import Button from "../ui/Button"
import type { ExternalLinkCardProps } from "./types"

function ExternalLinkCard({ icon, name, linkedValue, onLink, children }: ExternalLinkCardProps) {
    const { t } = useTranslation("settings")

    return (
        <div className="external-links">
            <div className="external-links__header">
                <img className="external-links__icon" src={icon} alt={name} />
                <span className="external-links__name">{name}</span>
                {linkedValue
                    ? <span className="external-links__value">{linkedValue}</span>
                    : <Button buttonLevel={2} onClick={onLink}>{t("link")}</Button>
                }
            </div>
            {children && (
                <div className="external-links__body">
                    {children}
                </div>
            )}
        </div>
    )
}

export default ExternalLinkCard