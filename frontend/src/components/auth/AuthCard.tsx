import "@styles/layouts/AuthLayout.scss"
import { useState } from "react"
import { useNavigate } from "react-router"
import { useTranslation } from "react-i18next"
import AuthInput from "./AuthInput"
import Button from "../ui/Button"
import Checkbox from "../ui/Checkbox"
import PasswordInput from "./PasswordInput"
import { useAuth } from "../../contexts/AuthContext"

function AuthCard() {
    const navigate = useNavigate()
    const { t } = useTranslation("auth")
    const { login } = useAuth()

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [remember, setRemember] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError(null)
        setSubmitting(true)
        try {
            await login(email, password, remember)
            navigate("/")
        } catch (err: any) {
            setError(err?.status === 401 ? t("wrongCredentials") : t("networkError"))
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <>
            <form id="login_form" className="login-card__form" onSubmit={handleSubmit}>
                <AuthInput
                    name="email"
                    placeholder={t("email")}
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={submitting}
                />
                <PasswordInput
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={submitting}
                />
                <Checkbox
                    text={t("rememberMe")}
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                />
                {error && <div className="login-card__form-error">{error}</div>}
                <Button buttonType="submit" disabled={submitting}>{t("logIn")}</Button>
                <div className="login-card__form-reminder" onClick={() => navigate("/auth/reset")}>{t("forgotPassword")}</div>
            </form>
        </>
    )
}

export default AuthCard
