import { useNavigate } from "react-router"
import { useTranslation } from "react-i18next"
import Button from "../ui/Button"
import AuthInput from "./AuthInput"

function ResetCard() {
    const navigate = useNavigate()
    const { t } = useTranslation('auth')

    return (
        <form>
            <AuthInput name="email" placeholder={t('email')} type="text"/>
            <Button onClick={() => {console.log("Password reset")}}>
                {t('resetPassword')}
            </Button>
            <Button buttonLevel={2} onClick={() => {navigate(-1)}}>{t('goBack')}</Button>
        </form>
    )
}

export default ResetCard