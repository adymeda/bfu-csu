export interface CalendarEvent {
    id: string
    title: string
    startTime: string  // "H:MM" or "HH:MM"
    endTime: string    // "H:MM" or "HH:MM"
    color: string      // CSS color (hex)
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