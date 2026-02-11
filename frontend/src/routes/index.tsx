import { BrowserRouter, Route, Routes } from "react-router"
import NotFoundPage from "../components/NotFoundPage"
import AuthPage from "../components/auth/AuthPage"

function AppRouter() {
	return (
		<BrowserRouter>
			<Routes>
					<Route path="/auth" element={<AuthPage />}></Route>
					<Route path="*" element={<NotFoundPage />}/>
			</Routes>
		</BrowserRouter>
	)
}

export default AppRouter