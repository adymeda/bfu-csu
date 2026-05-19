import "./styles/index.scss"
import { I18nextProvider } from "react-i18next"
import i18n from "./locales/i18n"
import AppRouter from "./routes"
import { AuthProvider } from "./contexts/AuthContext"

function App() {
    return (
        <I18nextProvider i18n={i18n}>
            <AuthProvider>
                <AppRouter />
            </AuthProvider>
        </I18nextProvider>
    )
}

export default App