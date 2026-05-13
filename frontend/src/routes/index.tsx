import { createBrowserRouter, RouterProvider } from "react-router"
import NotFoundPage from "../components/NotFoundPage"
import AuthCard from "../components/auth/AuthCard"
import AuthLayout from "../layouts/AuthLayout"
import MainLayout from "../layouts/MainLayout"
import ResetCard from "../components/auth/ResetCard"
import CalendarPage from "../pages/CalendarPage"
import InboxPage from "../pages/InboxPage"

const router = createBrowserRouter([
	{
		path: "/",
		element: <MainLayout />,
		errorElement: <NotFoundPage />,
		children: [
			{ index: true, element: <CalendarPage /> },
			{ path: "inbox", element: <InboxPage /> },
			{ path: "settings" },
		],
	},
	{
		path: "/auth",
		element: <AuthLayout />,
		children: [
			{ index: true, element: <AuthCard /> },
			{ path: "reset", element: <ResetCard /> },
		],
	},
	{ path: "*", element: <NotFoundPage /> },
])

function AppRouter() {
	return <RouterProvider router={router} />
}

export default AppRouter