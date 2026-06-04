import "@styles/components/calendar/CalendarAssistant.scss"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useAskCalendar } from "../../hooks/llm"

function CalendarAssistant() {
	const { t } = useTranslation("calendar")
	const [question, setQuestion] = useState("")
	const { data, isPending, isError, mutate } = useAskCalendar()

	function handleAsk() {
		if(!question.trim() || isPending) return
		mutate(question.trim())
	}

	function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
		if(e.key === "Enter" && !e.shiftKey) {
			e.preventDefault()
			handleAsk()
		}
	}

	return (
		<div className="calendar-assistant">
			<div className="calendar-assistant__input-row">
				<textarea
					className="calendar-assistant__input"
					placeholder={t("assistant.placeholder")}
					value={question}
					onChange={e => setQuestion(e.target.value)}
					onKeyDown={handleKeyDown}
					rows={2}
				/>
				<button
					className="calendar-assistant__ask-button"
					onClick={handleAsk}
					disabled={!question.trim() || isPending}
				>
					{isPending
						? <><span className="calendar-assistant__spinner" /> {t("assistant.asking")}</>
						: t("assistant.ask")
					}
				</button>
			</div>

			{isPending && (
				<div className="calendar-assistant__answer calendar-assistant__answer--loading">
					<span className="calendar-assistant__spinner" />
					<span>{t("assistant.loading")}</span>
				</div>
			)}

			{isError && !isPending && (
				<div className="calendar-assistant__answer calendar-assistant__answer--error">
					{t("assistant.error")}
				</div>
			)}

			{data && !isPending && !isError && (
				<div className="calendar-assistant__answer">
					<p className="calendar-assistant__answer-text">{data.answer}</p>
				</div>
			)}

			{!data && !isPending && !isError && (
				<div className="calendar-assistant__answer calendar-assistant__answer--empty">
					{t("assistant.empty")}
				</div>
			)}
		</div>
	)
}

export default CalendarAssistant
