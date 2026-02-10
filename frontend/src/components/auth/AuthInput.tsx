import "@styles/auth/AuthInput.scss"
import type { AuthInputProps } from "./types"

function AuthInput(props: AuthInputProps) {
    const { placeholder, type, name, children } = props

    return(
        <div className="auth__input">
            <input type={type} name={name} placeholder={placeholder}/>
            {children}
        </div>
    )
}

export default AuthInput