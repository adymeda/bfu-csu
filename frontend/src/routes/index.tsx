import { createBrowserRouter, RouterProvider, Navigate, Outlet } from "react-router"
import type { ReactNode } from "react"
import NotFoundPage from "../components/NotFoundPage"
import AuthCard from "../components/auth/AuthCard"
import AuthLayout from "../layouts/AuthLayout"
import MainLayout from "../layouts/MainLayout"
import ResetCard from "../components/auth/ResetCard"
import CalendarPage from "../pages/CalendarPage"
import InboxPage from "../pages/InboxPage"
import ManagementPage from "../pages/ManagementPage"
import { useAuth } from "../contexts/AuthContext"

function RequireAuth({ children }: { children: ReactNode }) {
    const { status } = useAuth()
    if (status === "loading") return null
    if (status === "nouser") return <Navigate to="/auth" replace />
    return <>{children}</>
}

function RedirectIfAuthed({ children }: { children: ReactNode }) {
    const { status } = useAuth()
    if (status === "loading") return null
    if (status === "authed") return <Navigate to="/" replace />
    return <>{children}</>
}

const router = createBrowserRouter([
    {
        path: "/",
        element: <RequireAuth>
            <MainLayout />
        </RequireAuth>,
        errorElement: <NotFoundPage />,
        children: [
            { index: true, element: <CalendarPage /> },
            { path: "inbox", element: <InboxPage /> },
            { path: "settings", element: <Outlet /> },
            { path: "management", element: <ManagementPage />}
        ],
    },
    {
        path: "/auth",
        element: <RedirectIfAuthed>
            <AuthLayout />
        </RedirectIfAuthed>,
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