import { BrowserRouter, Route, Routes } from "react-router"
import NotFoundPage from "../components/NotFoundPage"
import AuthCard from "../components/auth/AuthCard"
import AuthLayout from "../layouts/AuthLayout"
import MainLayout from "../layouts/MainLayout"
import ResetCard from "../components/auth/ResetCard"
import CalendarPage from "../pages/CalendarPage"
import InboxPage from "../pages/InboxPage"

function AppRouter() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<MainLayout />}>
					<Route index element={<CalendarPage />} />
					<Route path="inbox" element={<InboxPage />} />
					<Route path="settings" />
				</Route>
				<Route path="/auth" element={<AuthLayout />}>
					<Route index element={<AuthCard />} />
					<Route path="reset" element={<ResetCard />} />
				</Route>
				<Route path="*" element={<NotFoundPage />}/>
			</Routes>
		</BrowserRouter>
	)
}

export default AppRouter