import type { EventResolved, DeadlineResolved } from "../../api/types"
import type { CalendarEvent, CalendarDeadline } from "./types"

export const EVENT_COLOR = "#42a5f5"
export const DEADLINE_COLOR = "#ef5350"

export function toCalendarEvent(e: EventResolved): CalendarEvent {
    return {
        id: String(e.id),
        title: e.title,
        startDate: new Date(e.start_at),
        endDate: e.end_at ? new Date(e.end_at) : undefined,
        color: EVENT_COLOR,
        organizer: e.created_by.display_name,
        messageId: e.message_id
    }
}

export function toCalendarDeadline(d: DeadlineResolved): CalendarDeadline {
    return {
        id: String(d.id),
        title: d.title,
        date: new Date(d.due_at)
    }
}
