import clsx from "clsx"
import { useTranslation } from "react-i18next"
import "@styles/components/calendar/EventList.scss"
import type { CalendarEvent } from "./types"

interface EventListProps {
	events: CalendarEvent[]
	selectedId: string | null
	onSelect: (id: string) => void
}

function EventList({ events, selectedId, onSelect }: EventListProps) {
	const { t } = useTranslation('calendar')

	if (events.length === 0) {
		return (
			<div className="event-list event-list--empty">
				<span>{t('noEvents')}</span>
			</div>
		)
	}

	return (
		<div className="event-list">
			{events.map(event => (
				<div key={event.id}
					className={clsx("event-list__item", selectedId === event.id && "event-list__item--active")}
					onClick={() => onSelect(event.id)}>
					<span className="event-list__item-dot" style={{ backgroundColor: event.color }} />
					<div className="event-list__item-body">
						<span className="event-list__item-title">{event.title}</span>
						<span className="event-list__item-meta">{event.startTime}-{event.endTime} · {event.place}</span>
					</div>
				</div>
			))}
		</div>
	)
}

export default EventList