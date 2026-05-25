import type { MessageProps } from "@components/inbox/types"

export interface CalendarEvent {
    id: string
    title: string
    startDate: Date
    endDate: Date
    place: string
    color: string
    organizer?: string
    description?: string
    linkedMessage?: MessageProps
}

export interface MonthCalendarProps {
    events: CalendarEvent[]
    deadlines?: CalendarDeadline[]
    selectedDate: Date
    monthCursor: Date
    onDaySelect: (date: Date) => void
}

export interface PositionedEvent {
    event: CalendarEvent
    row: number
}

export interface CalendarDeadline {
    id: string
    title: string
    date: Date
}

export interface DayCalendarProps {
    events: CalendarEvent[]
    deadlines?: CalendarDeadline[]
    date?: Date
    selectedEventId?: string | null
    onEventSelect?: (id: string) => void
}