import clsx from "clsx"
import { useTranslation } from "react-i18next"
import { ExclamationCircleIcon } from "@heroicons/react/24/outline"
import type { MonthCalendarProps } from "./types"
import { toISODate, hexToRgba, isSameDay } from "@helpers"
import "@styles/components/calendar/MonthCalendar.scss"

const MAX_VISIBLE_EVENTS = 3

function buildGrid(monthStart: Date): Date[] {
    const offset = (monthStart.getDay() + 6) % 7
    const cells: Date[] = []
    for (let i = 0; i < 42; i++) {
        const d = new Date(monthStart)
        d.setDate(1 - offset + i)
        cells.push(d)
    }
    return cells
}

function getWeekdayHeaders(locale: string): string[] {
    const fmt = new Intl.DateTimeFormat(locale, { weekday: "short" })
    return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(2024, 0, i + 1)))
}

function MonthCalendar({ events, deadlines = [], selectedDate, monthCursor, onDaySelect }: MonthCalendarProps) {
    const { t, i18n } = useTranslation("calendar")
    const weekLocale = i18n.language === "ru" ? "ru-RU" : "en-US"
    const today = new Date()

    const grid = buildGrid(monthCursor)
    const weekdays = getWeekdayHeaders(weekLocale)

    return (
        <div className="month-calendar">
            <div className="month-calendar__grid-wrapper">
                <div className="month-calendar__grid">
                    {weekdays.map((wd, i) => (
                        <div key={`wd-${i}`} className="month-calendar__weekday">{wd}</div>
                    ))}

                    {grid.map((cellDate, i) => {
                        const inMonth = cellDate.getMonth() === monthCursor.getMonth()
                        const isToday = isSameDay(cellDate, today)
                        const isSelected = isSameDay(cellDate, selectedDate)
                        const isoDate = toISODate(cellDate)
                        const dayEvents = events.filter(e => toISODate(e.startDate) === isoDate)
                        const visibleEvents = dayEvents.slice(0, MAX_VISIBLE_EVENTS)
                        const extraCount = dayEvents.length - visibleEvents.length
                        const dayDeadlineCount = deadlines.filter(d => toISODate(d.date) === isoDate).length

                        const cellClass = clsx("month-calendar__cell", !inMonth && "month-calendar__cell--outside")
                        const dayClass = clsx("month-calendar__day", isToday && "month-calendar__day--today", isSelected && "month-calendar__day--selected")

                        return (
                            <div key={i} className={cellClass} onClick={() => onDaySelect(cellDate)}>
                                <div className="month-calendar__cell-header">
                                    <span className={dayClass}>
                                        {cellDate.getDate()}
                                    </span>
                                    {dayDeadlineCount > 0 && (
                                        <div className="month-calendar__deadline-badge">
                                            <span>{dayDeadlineCount}</span>
                                            <ExclamationCircleIcon />
                                        </div>
                                    )}
                                </div>
                                <div className="month-calendar__cell-events">
                                    {visibleEvents.map(event => (
                                        <div key={event.id}
                                        className="month-calendar__event"
                                        style={{ borderLeftColor: event.color, backgroundColor: hexToRgba(event.color, 0.1)}}>
                                            <span className="month-calendar__event-title">
                                                {event.title}
                                            </span>
                                        </div>
                                    ))}
                                    {extraCount > 0 && (
                                        <span className="month-calendar__more">
                                            {t("moreEvents", { count: extraCount })}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

export default MonthCalendar