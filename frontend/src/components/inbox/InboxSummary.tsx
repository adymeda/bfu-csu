import { useTranslation } from "react-i18next"
import { useSummarizeInbox } from "../../hooks/llm"
import "@styles/components/inbox/InboxSummary.scss"

function InboxSummary() {
	const { t } = useTranslation("inbox")
	const { data, isLoading, isError } = useSummarizeInbox(true)

	if(isLoading) {
		return (
			<div className="inbox-summary inbox-summary--loading">
				<span className="inbox-summary__spinner" />
				<span>{t("summary.loading")}</span>
			</div>
		)
	}

	if(isError) {
		return (
			<div className="inbox-summary inbox-summary--error">
				{t("summary.error")}
			</div>
		)
	}

	if(!data?.summary) {
		return (
			<div className="inbox-summary inbox-summary--empty">
				{t("summary.empty")}
			</div>
		)
	}

	return (
		<div className="inbox-summary">
			<p className="inbox-summary__text">{data.summary}</p>
		</div>
	)
}

export default InboxSummary
