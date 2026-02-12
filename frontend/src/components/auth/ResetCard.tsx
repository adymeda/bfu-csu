import { useNavigate } from "react-router"
import Button from "../ui/Button"
import AuthInput from "./AuthInput"

function ResetCard() {
    const navigate = useNavigate()

    return (
        <form>
            <AuthInput name="email" placeholder="E-mail" type="text"/>
            <Button onClick={() => {console.log("Password reset")}}>
                Отправить
            </Button>
            <Button buttonLevel={2} onClick={() => {navigate(-1)}}>Назад</Button>
        </form>
    )
}

export default ResetCard