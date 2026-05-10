import { useRef, useEffect, useState, useCallback } from "react"
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline"
import type { DayCalendarProps, CalendarEvent, PositionedEvent } from "./types"
import { timeToMinutes, hexToRgba } from "@helpers"
import "@styles/components/calendar/DayCalendar.scss"

const CELL_WIDTH = 100
const HOURS_COUNT = 24
const TOTAL_MINUTES = HOURS_COUNT * 60
const EVENT_ROW_HEIGHT = 76
const EVENT_PADDING = 6
const NOW_LINE_SCROLL_OFFSET = 24

function assignRows(events: CalendarEvent[]): PositionedEvent[] {
    const sorted = [...events].sort(
        (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
    )
    const rowEndTimes: number[] = []

    return sorted.map(event => {
        const startMin = timeToMinutes(event.startTime)
        const endMin = timeToMinutes(event.endTime)

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

function isSameDay(a: Date, b: Date): boolean {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    )
}

function formatDate(date: Date): string {
    return new Intl.DateTimeFormat("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
    })
        .format(date)
        .replace(" г.", "")
}

function addDays(date: Date, days: number): Date {
    const d = new Date(date)
    d.setDate(d.getDate() + days)
    return d
}

function DayCalendar({ events, date: initialDate, onDateChange }: DayCalendarProps) {
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

    const handlePrev = () => {
        const next = addDays(selectedDate, -1)
        setSelectedDate(next)
        onDateChange?.(next)
    }

    const handleNext = () => {
        const next = addDays(selectedDate, 1)
        setSelectedDate(next)
        onDateChange?.(next)
    }

    const handleToday = () => {
        const next = new Date()
        setSelectedDate(next)
        onDateChange?.(next)
    }

    const positionedEvents = assignRows(events)
    const rowCount = positionedEvents.length > 0
        ? Math.max(...positionedEvents.map(p => p.row)) + 1
        : 0
    const totalWidth = CELL_WIDTH * HOURS_COUNT

    const timelineWrapperClass = [
        "day-calendar__timeline-wrapper",
        shadows.left  && "day-calendar__timeline-wrapper--shadow-left",
        shadows.right && "day-calendar__timeline-wrapper--shadow-right",
    ].filter(Boolean).join(" ")

    return (
        <div className="day-calendar">
            <div className="day-calendar__header">
                <div className="day-calendar__header-nav">
                    {!isToday && (
                        <button
                            className="day-calendar__today-btn"
                            onClick={handleToday}
                        >
                            Сегодня
                        </button>
                    )}
                    <button
                        className="day-calendar__nav-btn"
                        onClick={handlePrev}
                        aria-label="Предыдущий день"
                    >
                        <ChevronLeftIcon />
                    </button>
                    <span className="day-calendar__nav-date">
                        {formatDate(selectedDate)}
                    </span>
                    <button
                        className="day-calendar__nav-btn"
                        onClick={handleNext}
                        aria-label="Следующий день"
                    >
                        <ChevronRightIcon />
                    </button>
                </div>
            </div>

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

                        <div
                            className="day-calendar__events"
                            style={{ height: rowCount * EVENT_ROW_HEIGHT }}
                        >
                            {Array.from({ length: HOURS_COUNT }, (_, i) => (
                                <div key={i} className="day-calendar__events-column" />
                            ))}

                            {positionedEvents.map(({ event, row }) => {
                                const startMin = timeToMinutes(event.startTime)
                                const endMin = timeToMinutes(event.endTime)
                                const left = (startMin / TOTAL_MINUTES) * totalWidth
                                const width = ((endMin - startMin) / TOTAL_MINUTES) * totalWidth

                                return (
                                    <div key={event.id}
                                        className="day-calendar__event"
                                        style={{
                                            left,
                                            width,
                                            top: row * EVENT_ROW_HEIGHT + EVENT_PADDING,
                                            height: EVENT_ROW_HEIGHT - EVENT_PADDING * 2,
                                            backgroundColor: hexToRgba(event.color, 0.13),
                                            borderLeftColor: event.color,
                                        }}
                                    >
                                        <span className="day-calendar__event-title">
                                            {event.title}
                                        </span>
                                        <span className="day-calendar__event-time">
                                            {event.startTime}–{event.endTime}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>

                        {isToday && (
                            <div
                                className="day-calendar__now-line"
                                style={{ left: nowLeft }}
                            />
                        )}

                    </div>
                </div>
            </div>
        </div>
    )
}

export default DayCalendar
