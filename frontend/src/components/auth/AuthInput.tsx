import "@styles/components/auth/AuthInput.scss"
import type { AuthInputProps } from "./types"

function AuthInput(props: AuthInputProps) {
    const { placeholder, type, name, value, onChange, disabled, children } = props

    return(
        <div className="auth__input">
            <input
                type={type}
                name={name}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                disabled={disabled}
            />
            {children}
        </div>
    )
}

export default AuthInput