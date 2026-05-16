import { useState } from "react"
import "@styles/pages/CalendarPage.scss"
import { useTranslation } from "react-i18next"
import DayCalendar from "../components/calendar/DayCalendar"
import EventList from "../components/calendar/EventList"
import EventDetail from "../components/calendar/EventDetail"
import type { CalendarEvent } from "../components/calendar/types"

const EVENTS: CalendarEvent[] = [
	{
		id: "1",
		title: "Лекция",
		startTime: "8:30",
		endTime: "10:00",
		place: "Ауд. 231",
		color: "#42a5f5",
		organizer: "Ишанов Сергей Александрович",
		description: "Лекция по дифференциальным уравнениям. Раздел: однородные уравнения первого порядка.",
		linkedMessage: {
			author: "Ишанов Сергей Александрович",
			title: "Переписка контрольных по дифференциальным уравнениям",
			text: "Следующая переписка контрольных работ по дифференциальным уравнениям пройдёт 14 апреля в 13:50, аудитория 229. Старосты должны предварительно предоставить списки переписываемых контрольных работ",
		},
	},
	{
		id: "2",
		title: "Общее собрание",
		startTime: "12:00",
		endTime: "14:00",
		place: "Ауд. 420",
		color: "#ab47bc",
	},
	{
		id: "3",
		title: "Экзамен",
		startTime: "14:30",
		endTime: "17:00",
		place: "Ауд. 123",
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
	const [selectedEventId, setSelectedEventId] = useState<string | null>(null)

	const count = EVENTS.length
	const pluralKey = getEventsPluralKey(count, i18n.language)
	const eventsLabel = t(`eventsTodayCount.${pluralKey}`, { count })

	const selectedEvent = EVENTS.find(e => e.id === selectedEventId) ?? null

	return (
		<div className="calendar-page">
			<div className="calendar-page__titlebar">
				<div className="calendar-page__title">
					<span className="calendar-page__title-text">{tCommon('navigation.calendar')}</span>
					<span className="calendar-page__title-info">{eventsLabel}</span>
				</div>
			</div>

			<div className="calendar-page__body">
				<div className="calendar-page__calendar">
					<DayCalendar
						events={EVENTS}
						selectedEventId={selectedEventId}
						onEventSelect={setSelectedEventId}
					/>
				</div>

				<div className="calendar-page__events-preview">
					<div className="calendar-page__events-list">
						<EventList
							events={EVENTS}
							selectedId={selectedEventId}
							onSelect={setSelectedEventId}
						/>
					</div>
					<div className="calendar-page__events-detail">
						{selectedEvent
							? <EventDetail event={selectedEvent} />
							: <div className="calendar-page__events-placeholder">
								<span>{t('selectEvent')}</span>
							</div>
						}
					</div>
				</div>
			</div>
		</div>
	)
}

export default CalendarPage