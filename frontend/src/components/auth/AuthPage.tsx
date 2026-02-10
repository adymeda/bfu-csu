import "@styles/auth/Auth.scss"
import randomImg from "@assets/nevskogo.jpg"
import randomImg2 from "@assets/chernysh.webp"
import AuthInput from "./AuthInput"
import Button from "../ui/Button"

function AuthPage() {
    const imgs = [ randomImg, randomImg2 ]
    const rand = Math.floor(Math.random() * imgs.length)

    return (
        <div className="auth">
            <img src={imgs[rand]} alt="" draggable={false}/>
            <div className="auth__content">
                <div className="login-card">
                    <img src="https://kantiana.ru/bitrix/templates/bfu.2023/images/svg/logo--short.svg" alt="BFU Logo" draggable={false} className="login-card__logo"/>
                    <form id="login_form" className="login-card__form">
                        {/* <input type="text" name="email" placeholder="E-mail"/> */}
                        <AuthInput name="email" placeholder="E-mail" type="text"/>
                        <AuthInput name="password" placeholder="Пароль" type="password">
                            eye_icon
                        </AuthInput>
                        <div className="login-card__form-error">Неверная почта или пароль</div>
                        <Button onClick={() => console.log("Click")}>Button</Button>
                        <div className="login-card__form-reminder">Забыли пароль?</div>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default AuthPage