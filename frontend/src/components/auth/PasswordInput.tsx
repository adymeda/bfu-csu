import "@styles/auth/PasswordInput.scss"
import { useState } from "react"
import EyeIcon from "@assets/icons/eye.svg?react"
import EyeSlashIcon from "@assets/icons/eye-slash.svg?react"
import AuthInput from "./AuthInput"

function PasswordInput() {

    const [eyeOpened, setEyeOpened] = useState(false)

    return (
        <AuthInput name="password" placeholder="Пароль" type={eyeOpened ? "text" : "password"}>
            <div className="password-view" onClick={() => setEyeOpened(!eyeOpened)}>
                {eyeOpened ? <EyeSlashIcon />: <EyeIcon />}
            </div>
        </AuthInput>
    )
}

export default PasswordInput