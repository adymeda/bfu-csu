import "@styles/layouts/AuthLayout.scss"
import randomImg from "@assets/nevskogo.jpg"
import randomImg2 from "@assets/chernysh.webp"
import flagRu from "@assets/langs/ru.webp"
import flagEn from "@assets/langs/en.webp"
import { useRef } from "react"
import { Outlet } from "react-router"
import Logo from "../components/ui/Logo"
import Dropdown from "../components/ui/Dropdown"
import clsx from "clsx"
import { useTranslation } from "react-i18next"
import i18n from "../locales/i18n"

const langs = [
    { code: "ru", label: "Русский", flag: flagRu },
    { code: "en", label: "English", flag: flagEn },
]

function AuthLayout() {
    const imgs = [ randomImg, randomImg2 ]
    const rand = useRef(Math.floor(Math.random() * imgs.length))

    const { i18n: { language } } = useTranslation()
    const current = langs.find(l => l.code === language) ?? langs[0]

    return (
        <div className="auth">
            <img src={imgs[rand.current]} alt="" draggable={false}/>
            <div className="auth__content">
                <div className="login-card">
                    <Logo className="login-card__logo"/>
                    <Outlet />
                </div>
                <Dropdown
                    trigger={
                        <div className="lang-switch__trigger">
                            <img src={current.flag} className="lang-switch__flag" alt={current.label}/>
                            <span>{current.label}</span>
                        </div>
                    }
                    className="lang-switch__menu">
                    {langs.map(l => (
                        <div key={l.code}
                            className={clsx("lang-switch__item", l.code === language && "lang-switch__item--active")}
                            onClick={() => i18n.changeLanguage(l.code)}>
                            <img src={l.flag} className="lang-switch__flag" alt={l.label}/>
                            <span>{l.label}</span>
                        </div>
                    ))}
                </Dropdown>
            </div>
        </div>
    )
}

export default AuthLayout