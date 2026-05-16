import { ClockIcon, MapPinIcon, UserIcon } from "@heroicons/react/24/outline"
import { useTranslation } from "react-i18next"
import "@styles/components/calendar/EventDetail.scss"
import Message from "@components/inbox/Message"
import type { CalendarEvent } from "./types"
import { formatTime } from "@helpers"

interface EventDetailProps {
	event: CalendarEvent
}

function EventDetail({ event }: EventDetailProps) {
	const { t } = useTranslation('calendar')

	return (
		<div className="event-detail">
			<div className="event-detail__color-bar" style={{ backgroundColor: event.color }} />
			<div className="event-detail__body">
				<h2 className="event-detail__title">{event.title}</h2>
				<div className="event-detail__meta">
					<div className="event-detail__meta-row">
						<ClockIcon />
						<span>{formatTime(event.startDate)}-{formatTime(event.endDate)}</span>
					</div>
					<div className="event-detail__meta-row">
						<MapPinIcon />
						<span>{event.place}</span>
					</div>
					{event.organizer && (
						<div className="event-detail__meta-row">
							<UserIcon />
							<span>{event.organizer}</span>
						</div>
					)}
				</div>
				{event.description && (
					<p className="event-detail__description">{event.description}</p>
				)}
				{event.linkedMessage && (
					<div className="event-detail__message">
						<span className="event-detail__message-label">{t('linkedMessage')}</span>
						<Message author={event.linkedMessage.author}
							title={event.linkedMessage.title}
							text={event.linkedMessage.text}
							isRead />
					</div>
				)}
			</div>
		</div>
	)
}

export default EventDetail