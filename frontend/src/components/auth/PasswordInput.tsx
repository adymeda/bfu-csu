import "@styles/components/auth/PasswordInput.scss"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline"
import AuthInput from "./AuthInput"

function PasswordInput() {
    const [eyeOpened, setEyeOpened] = useState(false)
    const { t } = useTranslation('auth')

    return (
        <AuthInput name="password" placeholder={t('password')} type={eyeOpened ? "text" : "password"}>
            <div className="password-view" onClick={() => setEyeOpened(!eyeOpened)}>
                {eyeOpened ? <EyeSlashIcon />: <EyeIcon />}
            </div>
        </AuthInput>
    )
}

export default PasswordInput