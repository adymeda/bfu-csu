import "./styles/index.scss"
import AppRouter from "./routes"
import I18nProvider from "./locales/I18nProvider"

function App() {
	return (
		<I18nProvider>
			<AppRouter />
		</I18nProvider>
	)
}

export default App
