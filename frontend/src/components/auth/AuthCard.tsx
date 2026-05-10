import "@styles/layouts/AuthLayout.scss"
import { useNavigate } from "react-router"
import AuthInput from "./AuthInput"
import Button from "../ui/Button"
import Checkbox from "../ui/Checkbox"
import PasswordInput from "./PasswordInput"

function AuthCard() {
    const navigate = useNavigate()

    return (
        <>
            <form id="login_form" className="login-card__form">
                {/* <input type="text" name="email" placeholder="E-mail"/> */}
                <AuthInput name="email" placeholder="E-mail" type="text"/>
                <PasswordInput />
                <Checkbox text="Запомнить меня" />
                <div className="login-card__form-error">Неверная почта или пароль</div>
                <Button onClick={() => navigate("/")}>Войти</Button>
                <div className="login-card__form-reminder" onClick={() => navigate("/auth/reset")}>Забыли пароль?</div>
            </form>
        </>
    )
}

export default AuthCard