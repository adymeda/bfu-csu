import { BrowserRouter, Route, Routes } from "react-router"
import NotFoundPage from "../components/NotFoundPage"
import AuthCard from "../components/auth/AuthCard"
import AuthLayout from "../layouts/AuthLayout"

function AppRouter() {
	return (
		<BrowserRouter>
			<Routes>
					<Route path="/auth" element={<AuthLayout />}>
						<Route index element={<AuthCard />} />
						<Route path="reset" element={<h1>Do some job!</h1>} />
					</Route>
					<Route path="*" element={<NotFoundPage />}/>
			</Routes>
		</BrowserRouter>
	)
}

export default AppRouter