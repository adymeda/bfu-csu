export interface CalendarEvent {
    id: string
    title: string
    startTime: string
    endTime: string
    color: string
}

export interface PositionedEvent {
    event: CalendarEvent
    row: number
}

export interface DayCalendarProps {
    events: CalendarEvent[]
    date?: Date
    onDateChange?: (date: Date) => void
}