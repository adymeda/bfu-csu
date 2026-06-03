import "./styles/index.scss"
import { I18nextProvider } from "react-i18next"
import { QueryClientProvider } from "@tanstack/react-query"
import i18n from "./locales/i18n"
import AppRouter from "./routes"
import { AuthProvider } from "./contexts/AuthContext"
import { ToastProvider } from "./contexts/ToastContext"
import { queryClient } from "./api/queryClient"

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <I18nextProvider i18n={i18n}>
                <AuthProvider>
                    <ToastProvider>
                        <AppRouter />
                    </ToastProvider>
                </AuthProvider>
            </I18nextProvider>
        </QueryClientProvider>
    )
}

export default App