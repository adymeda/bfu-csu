import "@styles/layouts/AuthLayout.scss"
import { useNavigate } from "react-router"
import { useTranslation } from "react-i18next"
import AuthInput from "./AuthInput"
import Button from "../ui/Button"
import Checkbox from "../ui/Checkbox"
import PasswordInput from "./PasswordInput"

function AuthCard() {
    const navigate = useNavigate()
    const { t } = useTranslation('auth')

    return (
        <>
            <form id="login_form" className="login-card__form">
                <AuthInput name="email" placeholder={t('email')} type="text"/>
                <PasswordInput />
                <Checkbox text={t('rememberMe')} />
                <div className="login-card__form-error">{t('wrongCredentials')}</div>
                <Button onClick={() => navigate("/")}>{t('logIn')}</Button>
                <div className="login-card__form-reminder" onClick={() => navigate("/auth/reset")}>{t('forgotPassword')}</div>
            </form>
        </>
    )
}

export default AuthCard