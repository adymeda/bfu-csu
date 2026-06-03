import { createContext, useCallback, useContext, useState } from "react"
import { createPortal } from "react-dom"
import type { ReactNode } from "react"
import Toast from "../components/ui/Toast"
import type { Toast as ToastItem, ToastContextValue, ToastType } from "./types"
import "@styles/components/ui/Toast.scss"

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([])

    function push(type: ToastType, message: string) {
        setToasts(prev => [...prev, { id: crypto.randomUUID(), type, message }])
    }

    function remove(id: string) {
        setToasts(prev => prev.filter(t => t.id !== id))
    }

    const success = useCallback((message: string) => push("success", message), [])
    const error = useCallback((message: string) => push("error", message), [])
    const info = useCallback((message: string) => push("info", message), [])
    const warning = useCallback((message: string) => push("warning", message), [])

    return (
        <ToastContext.Provider value={{ success, error, info, warning }}>
            {children}
            {createPortal(
                <div className="toast-viewport">
                    {toasts.slice(0, 3).map(t => (
                        <Toast key={t.id} toast={t} onDismiss={remove} />
                    ))}
                </div>,
                document.body
            )}
        </ToastContext.Provider>
    )
}

export function useToast(): ToastContextValue {
    const ctx = useContext(ToastContext)
    if (!ctx) throw new Error("useToast must be used inside ToastProvider")
    return ctx
}