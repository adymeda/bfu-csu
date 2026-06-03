import { useEffect, useRef, useState } from "react"
import clsx from "clsx"
import {
    CheckCircleIcon,
    XCircleIcon,
    ExclamationTriangleIcon,
    InformationCircleIcon,
    XMarkIcon
} from "@heroicons/react/24/outline"
import type { ToastProps } from "./types"

const ICONS = {
    success: CheckCircleIcon,
    error: XCircleIcon,
    warning: ExclamationTriangleIcon,
    info: InformationCircleIcon
}

const LEAVE_DURATION = 200

function Toast({ toast, onDismiss }: ToastProps) {
    const [leaving, setLeaving] = useState(false)
    const dismissedRef = useRef(false)

    function handleClose() {
        if (dismissedRef.current) return
        dismissedRef.current = true
        setLeaving(true)
        setTimeout(() => onDismiss(toast.id), LEAVE_DURATION)
    }

    useEffect(() => {
        const timer = setTimeout(handleClose, 7000)
        return () => clearTimeout(timer)
    }, [])

    const Icon = ICONS[toast.type]

    return (
        <div
            className={clsx("toast", `toast--${toast.type}`, leaving && "toast--leaving")}
            role="status"
        >
            <span className="toast__icon">
                <Icon />
            </span>
            <span className="toast__message">{toast.message}</span>
            <button className="toast__close" onClick={handleClose}>
                <XMarkIcon />
            </button>
        </div>
    )
}

export default Toast