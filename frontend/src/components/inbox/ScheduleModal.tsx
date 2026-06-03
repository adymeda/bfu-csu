import { useState } from "react"
import { useTranslation } from "react-i18next"
import "@styles/components/inbox/ScheduleModal.scss"
import Modal from "@components/ui/Modal"
import Button from "@components/ui/Button"
import type { MessageEventInput, MessageDeadlineInput } from "../../api/types"
import { isoToLocalInput } from "@helpers/index"

type SubmitResult =
    | { mode: "event", value: MessageEventInput }
    | { mode: "deadline", value: MessageDeadlineInput }

interface ScheduleModalProps {
    mode: "event" | "deadline"
    onClose: () => void
    onSubmit: (result: SubmitResult) => void
    initialTitle?: string
    initialStart?: string
    initialEnd?: string
    initialDue?: string
}

function ScheduleModal({ mode, onClose, onSubmit, initialTitle, initialStart, initialEnd, initialDue }: ScheduleModalProps) {
    const { t } = useTranslation("inbox")
    const [title, setTitle] = useState(initialTitle ?? "")
    const [start, setStart] = useState(initialStart ? isoToLocalInput(initialStart) : "")
    const [end, setEnd] = useState(initialEnd ? isoToLocalInput(initialEnd) : "")
    const [due, setDue] = useState(initialDue ? isoToLocalInput(initialDue) : "")

    const endBeforeStart = mode === "event" && end !== "" && start !== "" && new Date(end) < new Date(start)
    const valid = mode === "event"
        ? title.trim().length > 0 && start !== "" && !endBeforeStart
        : title.trim().length > 0 && due !== ""

    function handleSubmit() {
        if(!valid) return
        if(mode === "event") {
            onSubmit({
                mode: "event",
                value: {
                    title: title.trim(),
                    start_at: new Date(start).toISOString(),
                    ...(end !== "" && { end_at: new Date(end).toISOString() })
                }
            })
        } else {
            onSubmit({
                mode: "deadline",
                value: { title: title.trim(), due_at: new Date(due).toISOString() }
            })
        }
    }

    const footer = (
        <>
            <Button buttonLevel={2} onClick={onClose}>{t("schedule.cancel")}</Button>
            <Button buttonLevel={1} onClick={handleSubmit} disabled={!valid}>{t("schedule.save")}</Button>
        </>
    )

    return (
        <Modal
            title={mode === "event" ? t("schedule.eventTitle") : t("schedule.deadlineTitle")}
            onClose={onClose}
            footer={footer}
        >
            <div className="schedule-form__field">
                <label className="schedule-form__label">{t("schedule.name")}</label>
                <input
                    className="schedule-form__input"
                    autoFocus
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                />
            </div>
            {mode === "event"
                ? <>
                    <div className="schedule-form__field">
                        <label className="schedule-form__label">{t("schedule.start")}</label>
                        <input
                            className="schedule-form__input"
                            type="datetime-local"
                            value={start}
                            onChange={e => setStart(e.target.value)}
                        />
                    </div>
                    <div className="schedule-form__field">
                        <label className="schedule-form__label">{t("schedule.end")}</label>
                        <input
                            className="schedule-form__input"
                            type="datetime-local"
                            value={end}
                            onChange={e => setEnd(e.target.value)}
                        />
                        {endBeforeStart && (
                            <span className="schedule-form__error">{t("schedule.endBeforeStart")}</span>
                        )}
                    </div>
                </>
                : <div className="schedule-form__field">
                    <label className="schedule-form__label">{t("schedule.due")}</label>
                    <input
                        className="schedule-form__input"
                        type="datetime-local"
                        value={due}
                        onChange={e => setDue(e.target.value)}
                    />
                </div>
            }
        </Modal>
    )
}

export default ScheduleModal
export type { SubmitResult }