import clsx from "clsx"
import { useRef, useEffect, useState, useCallback } from "react"
import type { DayCalendarProps, CalendarEvent, PositionedEvent } from "./types"
import { hexToRgba, formatTime, dateToMinutes, isSameDay } from "@helpers"
import "@styles/components/calendar/DayCalendar.scss"

const CELL_WIDTH = 100
const HOURS_COUNT = 24
const TOTAL_MINUTES = HOURS_COUNT * 60
const EVENT_ROW_HEIGHT = 76
const EVENT_PADDING = 6
const NOW_LINE_SCROLL_OFFSET = 24

function assignRows(events: CalendarEvent[]): PositionedEvent[] {
    const sorted = [...events].sort(
        (a, b) => dateToMinutes(a.startDate) - dateToMinutes(b.startDate)
    )
    const rowEndTimes: number[] = []

    return sorted.map(event => {
        const startMin = dateToMinutes(event.startDate)
        const endMin = dateToMinutes(event.endDate)

        const rowIndex = rowEndTimes.findIndex(t => t + 60 <= startMin)

        if (rowIndex === -1) {
            rowEndTimes.push(endMin)
            return { event, row: rowEndTimes.length - 1 }
        }

        rowEndTimes[rowIndex] = endMin
        return { event, row: rowIndex }
    })
}

function getNowLeft(): number {
    const now = new Date()
    const minutes = now.getHours() * 60 + now.getMinutes()
    return (minutes / TOTAL_MINUTES) * CELL_WIDTH * HOURS_COUNT
}

function DayCalendar({ events, date: initialDate, selectedEventId, onEventSelect }: DayCalendarProps) {
    const timelineRef = useRef<HTMLDivElement>(null)
    const [selectedDate, setSelectedDate] = useState(() => initialDate ?? new Date())
    const [nowLeft, setNowLeft] = useState(getNowLeft)
    const [shadows, setShadows] = useState({ left: false, right: false })

    const today = new Date()
    const isToday = isSameDay(selectedDate, today)

    const updateShadows = useCallback(() => {
        const el = timelineRef.current
        if (!el) return
        setShadows({
            left: el.scrollLeft > 0,
            right: el.scrollLeft < el.scrollWidth - el.clientWidth - 1,
        })
    }, [])

    useEffect(() => {
        if (initialDate) setSelectedDate(initialDate)
    }, [initialDate])

    useEffect(() => {
        const interval = setInterval(() => setNowLeft(getNowLeft()), 30000)
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        updateShadows()
        const el = timelineRef.current
        if (!el) return

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault()
            el.scrollLeft += e.deltaY
        }

        el.addEventListener("wheel", handleWheel, { passive: false })
        el.addEventListener("scroll", updateShadows)
        window.addEventListener("resize", updateShadows)

        return () => {
            el.removeEventListener("wheel", handleWheel)
            el.removeEventListener("scroll", updateShadows)
            window.removeEventListener("resize", updateShadows)
        }
    }, [updateShadows])

    useEffect(() => {
        const el = timelineRef.current
        if (!el) return

        if (isToday) {
            el.scrollLeft = Math.max(0, nowLeft - NOW_LINE_SCROLL_OFFSET)
        } else {
            el.scrollLeft = 0
        }
        updateShadows()
    }, [selectedDate, isToday, nowLeft, updateShadows])

    const positionedEvents = assignRows(events)
    const usedRows = positionedEvents.length > 0 ? Math.max(...positionedEvents.map(p => p.row)) + 1 : 0
    const rowCount = Math.max(2, usedRows)
    const totalWidth = CELL_WIDTH * HOURS_COUNT

    const timelineWrapperClass = clsx(
        "day-calendar__timeline-wrapper",
        shadows.left  && "day-calendar__timeline-wrapper--shadow-left",
        shadows.right && "day-calendar__timeline-wrapper--shadow-right",
    )

    return (
        <div className="day-calendar">
            <div className={timelineWrapperClass}>
                <div className="day-calendar__timeline" ref={timelineRef}>
                    <div className="day-calendar__track">

                        <div className="day-calendar__cells">
                            {Array.from({ length: HOURS_COUNT }, (_, i) => (
                                <div key={i} className="day-calendar__cell">
                                    <span className="day-calendar__cell-label">
                                        {`${i}:00`}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="day-calendar__events"
                            style={{ height: rowCount * EVENT_ROW_HEIGHT }}>
                            {Array.from({ length: HOURS_COUNT }, (_, i) => (
                                <div key={i} className="day-calendar__events-column" />
                            ))}

                            {positionedEvents.map(({ event, row }) => {
                                const startMin = dateToMinutes(event.startDate)
                                const endMin = dateToMinutes(event.endDate)
                                const left = (startMin / TOTAL_MINUTES) * totalWidth
                                const width = ((endMin - startMin) / TOTAL_MINUTES) * totalWidth

                                return (
                                    <div key={event.id}
                                        className={clsx("day-calendar__event", selectedEventId === event.id && "day-calendar__event--selected")}
                                        onClick={() => onEventSelect?.(event.id)}
                                        style={{
                                            left,
                                            width,
                                            top: row * EVENT_ROW_HEIGHT + EVENT_PADDING,
                                            height: EVENT_ROW_HEIGHT - EVENT_PADDING * 2,
                                            backgroundColor: hexToRgba(event.color, 0.13),
                                            borderLeftColor: event.color,
                                        }}>
                                        <span className="day-calendar__event-title">
                                            {event.title}
                                        </span>
                                        <span className="day-calendar__event-time">
                                            {formatTime(event.startDate)}-{formatTime(event.endDate)}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>

                        {isToday && (
                            <div className="day-calendar__now-line"
                                style={{ left: nowLeft }}/>
                        )}

                    </div>
                </div>
            </div>
        </div>
    )
}

export default DayCalendar