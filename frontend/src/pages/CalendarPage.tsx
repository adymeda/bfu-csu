import "@styles/pages/CalendarPage.scss"
import { useTranslation } from "react-i18next"
import DayCalendar from "../components/calendar/DayCalendar"
import type { CalendarEvent } from "../components/calendar/types"

const MOCK_EVENTS: CalendarEvent[] = [
	{
		id: "1",
		title: "Лекция",
		startTime: "8:30",
		endTime: "10:00",
		color: "#42a5f5",
	},
	{
		id: "2",
		title: "Общее собрание",
		startTime: "12:00",
		endTime: "14:00",
		color: "#ab47bc",
	},
	{
		id: "3",
		title: "Экзамен",
		startTime: "14:30",
		endTime: "17:00",
		color: "#ffa726",
	},
]

function getEventsPluralKey(count: number, lng: string): 'one' | 'two' | 'many' {
	if (lng === 'ru') {
		const mod10 = count % 10
		const mod100 = count % 100
		if (mod100 >= 11 && mod100 <= 19) return 'many'
		if (mod10 === 1) return 'one'
		if (mod10 >= 2 && mod10 <= 4) return 'two'
		return 'many'
	}
	return count === 1 ? 'one' : 'many'
}

function CalendarPage() {
	const { t, i18n } = useTranslation('calendar')
	const { t: tCommon } = useTranslation('common')

	const count = MOCK_EVENTS.length
	const pluralKey = getEventsPluralKey(count, i18n.language)
	const eventsLabel = t(`eventsTodayCount.${pluralKey}`, {
		count: count
	})

	return (
		<>
			<div className="calendar-page__titlebar">
				<div className="calendar-page__title">
					<span className="calendar-page__title-text">{tCommon('navigation.calendar')}</span>
					<span className="calendar-page__title-info">{eventsLabel}</span>
				</div>
			</div>

			<div className="calendar-page__content">
				<DayCalendar events={MOCK_EVENTS} />
			</div>
		</>
	)
}

export default CalendarPage