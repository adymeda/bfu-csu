import { useEffect } from "react"
import { createPortal } from "react-dom"
import { XMarkIcon } from "@heroicons/react/24/outline"
import "@styles/components/ui/Modal.scss"
import type { ModalProps } from "./types"

function Modal({ title, onClose, children, footer }: ModalProps) {
    // Capture-phase Escape so it closes the modal without also triggering
    // bubble-phase document handlers (e.g. InboxPage closing the composer).
    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            if(e.key !== "Escape") return
            e.stopPropagation()
            onClose()
        }
        document.addEventListener("keydown", onKeyDown, true)
        return () => document.removeEventListener("keydown", onKeyDown, true)
    }, [onClose])

    return createPortal(
        <div className="modal-overlay" onMouseDown={onClose}>
            <div className="modal" onMouseDown={e => e.stopPropagation()}>
                <div className="modal__header">
                    <span className="modal__title">{title}</span>
                    <button className="modal__close" onClick={onClose}>
                        <XMarkIcon />
                    </button>
                </div>
                <div className="modal__body">
                    {children}
                </div>
                {footer && (
                    <div className="modal__footer">
                        {footer}
                    </div>
                )}
            </div>
        </div>,
        document.body
    )
}

export default Modal
