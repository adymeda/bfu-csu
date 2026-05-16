import type { MessageProps } from "@components/inbox/types"

export interface CalendarEvent {
	id: string
	title: string
	startTime: string
	endTime: string
	place: string
	color: string
	organizer?: string
	description?: string
	linkedMessage?: MessageProps
}

export interface PositionedEvent {
	event: CalendarEvent
	row: number
}

export interface DayCalendarProps {
	events: CalendarEvent[]
	date?: Date
	onDateChange?: (date: Date) => void
	selectedEventId?: string | null
	onEventSelect?: (id: string) => void
}