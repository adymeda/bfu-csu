import clsx from "clsx"
import { useState, useMemo } from "react"
import "@styles/pages/CalendarPage.scss"
import { useTranslation } from "react-i18next"
import { CalendarDaysIcon, ViewColumnsIcon, ChevronLeftIcon, ChevronRightIcon, LightBulbIcon } from "@heroicons/react/24/outline"
import DayCalendar from "../components/calendar/DayCalendar"
import MonthCalendar from "../components/calendar/MonthCalendar"
import EventList from "../components/calendar/EventList"
import EventDetail from "../components/calendar/EventDetail"
import CalendarAssistant from "../components/calendar/CalendarAssistant"
import Dropdown from "../components/ui/Dropdown"
import { toCalendarEvent, toCalendarDeadline } from "../components/calendar/adapters"
import { useEvents, useDeadlines } from "../hooks/calendar"
import { useMessage } from "../hooks/messages"
import { toISODate, isSameDay, isSameMonth, addDays, addMonths, startOfMonth } from "@helpers"

type View = "month" | "day"

// Range fetched from the API for the current view. Day view loads just the
// selected day; month view loads the whole 6-week grid (±1 week of padding so
// leading/trailing cells from neighbouring months are covered).
function dayRange(d: Date): { from: string, to: string } {
    const from = new Date(d)
    from.setHours(0, 0, 0, 0)
    const to = new Date(d)
    to.setHours(23, 59, 59, 999)
    return { from: from.toISOString(), to: to.toISOString() }
}

function monthRange(cursor: Date): { from: string, to: string } {
    const from = addDays(startOfMonth(cursor), -7)
    const to = addDays(startOfMonth(addMonths(cursor, 1)), 7)
    return { from: from.toISOString(), to: to.toISOString() }
}

function getPluralKey(count: number, lng: string): "one" | "two" | "many" {
    if(lng === "ru") {
        const mod10 = count % 10
        const mod100 = count % 100
        if(mod100 >= 11 && mod100 <= 19) return "many"
        if(mod10 === 1) return "one"
        if(mod10 >= 2 && mod10 <= 4) return "two"
        return "many"
    }
    return count === 1 ? "one" : "many"
}

function formatDay(date: Date, lng: string): string {
    const locale = lng === "ru" ? "ru-RU" : "en-US"
    const formatted = new Intl.DateTimeFormat(locale, {
        day: "numeric",
        month: "long",
        year: "numeric",
    }).format(date)
    return lng === "ru" ? formatted.replace(" г.", "") : formatted
}

function formatMonthYear(date: Date, lng: string): string {
    const locale = lng === "ru" ? "ru-RU" : "en-US"
    const formatted = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(date)
    return lng === "ru" ? formatted.replace(" г.", "") : formatted
}

function CalendarPage() {
    const { t, i18n } = useTranslation("calendar")
    const { t: tCommon } = useTranslation("common")

    const today = new Date()
    const [view, setView] = useState<View>("day")
    const [selectedDate, setSelectedDate] = useState(() => new Date())
    const [monthCursor, setMonthCursor] = useState(() => startOfMonth(new Date()))
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null)

    const range = view === "day" ? dayRange(selectedDate) : monthRange(monthCursor)
    const { data: eventsData } = useEvents(range.from, range.to)
    const { data: deadlinesData } = useDeadlines(range.from, range.to)
    const events = useMemo(() => (eventsData ?? []).map(toCalendarEvent), [eventsData])
    const deadlines = useMemo(() => (deadlinesData ?? []).map(toCalendarDeadline), [deadlinesData])

    const eventsForDay = events.filter(e => toISODate(e.startDate) === toISODate(selectedDate))
    const deadlinesForDay = deadlines.filter(d => toISODate(d.date) === toISODate(selectedDate))
    const count = eventsForDay.length
    const deadlineCount = deadlinesForDay.length

    const eventsLabel = (() => {
        const today = t("today").toLowerCase()
        const hasEvents = count > 0
        const hasDeadlines = deadlineCount > 0
        if(hasEvents && hasDeadlines) {
            const evPart = t(`eventsCount.${getPluralKey(count, i18n.language)}`, { count })
            const dlPart = t(`deadlinesCount.${getPluralKey(deadlineCount, i18n.language)}`, { count: deadlineCount })
            return `${evPart} и ${dlPart} ${today}`
        }
        if(hasEvents) return `${t(`eventsCount.${getPluralKey(count, i18n.language)}`, { count })} ${today}`
        if(hasDeadlines) return `${t(`deadlinesCount.${getPluralKey(deadlineCount, i18n.language)}`, { count: deadlineCount })} ${today}`
        return `${t("eventsCount.many", { count: 0 })} ${today}`
    })()

    const selectedEvent = eventsForDay.find(e => e.id === selectedEventId) ?? null
    const { data: linkedMessageData } = useMessage(selectedEvent?.messageId ?? null)

    const enrichedEvent = useMemo(() => {
        if(!selectedEvent) return null
        if(!linkedMessageData) return selectedEvent
        return {
            ...selectedEvent,
            linkedMessage: {
                title: linkedMessageData.title,
                author: linkedMessageData.sender.display_name,
                authorColor: `#${linkedMessageData.sender.accent_color}`,
                text: linkedMessageData.content,
                isRead: linkedMessageData.is_read,
            }
        }
    }, [selectedEvent, linkedMessageData])

    const isOnToday = view === "day"
        ? isSameDay(selectedDate, today)
        : isSameMonth(monthCursor, today)

    const handlePrev = () => {
        if(view === "day") {
            const next = addDays(selectedDate, -1)
            setSelectedDate(next)
            setSelectedEventId(null)
        } else {
            setMonthCursor(addMonths(monthCursor, -1))
        }
    }

    const handleNext = () => {
        if(view === "day") {
            const next = addDays(selectedDate, 1)
            setSelectedDate(next)
            setSelectedEventId(null)
        } else {
            setMonthCursor(addMonths(monthCursor, 1))
        }
    }

    const handleToday = () => {
        if(view === "day") {
            setSelectedDate(new Date())
            setSelectedEventId(null)
        } else {
            setMonthCursor(startOfMonth(today))
        }
    }

    const handleDaySelect = (date: Date) => {
        setSelectedDate(date)
        setMonthCursor(startOfMonth(date))
        setSelectedEventId(null)
        setView("day")
    }

    const navLabel = view === "day"
        ? formatDay(selectedDate, i18n.language)
        : formatMonthYear(monthCursor, i18n.language)

    return (
        <div className="calendar-page">
            <div className="calendar-page__titlebar">
                <div className="calendar-page__title">
                    <span className="calendar-page__title-text">{tCommon("navigation.calendar")}</span>
                    <span className="calendar-page__title-info">{eventsLabel}</span>
                </div>

                <div className="calendar-page__nav">
                    {!isOnToday && (
                        <button className="calendar-page__nav-today" onClick={handleToday}>
                            {view === "day" ? t("today") : t("currentMonth")}
                        </button>
                    )}
                    <button
                        className="calendar-page__nav-button"
                        onClick={handlePrev}
                        aria-label={view === "day" ? t("prevDay") : t("prevMonth")}>
                        <ChevronLeftIcon />
                    </button>
                    <span className="calendar-page__nav-date">{navLabel}</span>
                    <button
                        className="calendar-page__nav-button"
                        onClick={handleNext}
                        aria-label={view === "day" ? t("nextDay") : t("nextMonth")}>
                        <ChevronRightIcon />
                    </button>
                </div>

                <Dropdown
                    trigger={
                        <button className="calendar-page__assistant-button" title={t("assistant.tooltip")}>
                            <LightBulbIcon />
                        </button>
                    }
                >
                    <CalendarAssistant />
                </Dropdown>

                <div className="calendar-page__view-switch">
                    <button
                        className={clsx("calendar-page__view-button", view === "month" && "calendar-page__view-button--active")}
                        onClick={() => setView("month")}
                        aria-label={t("monthView")}>
                        <CalendarDaysIcon />
                    </button>
                    <button
                        className={clsx("calendar-page__view-button", view === "day" && "calendar-page__view-button--active")}
                        onClick={() => setView("day")}
                        aria-label={t("dayView")}>
                        <ViewColumnsIcon />
                    </button>
                </div>
            </div>

            <div className="calendar-page__body">
                <div className="calendar-page__calendar">
                    {view === "month"
                        ? <MonthCalendar
                            events={events}
                            deadlines={deadlines}
                            selectedDate={selectedDate}
                            monthCursor={monthCursor}
                            onDaySelect={handleDaySelect}
                        />
                        : <DayCalendar
                            events={eventsForDay}
                            deadlines={deadlinesForDay}
                            date={selectedDate}
                            selectedEventId={selectedEventId}
                            onEventSelect={setSelectedEventId}
                        />
                    }
                </div>

                {view === "day" && (
                    <div className="calendar-page__events-preview">
                        <div className="calendar-page__events-list">
                            <EventList
                                events={eventsForDay}
                                selectedId={selectedEventId}
                                onSelect={setSelectedEventId}
                            />
                        </div>
                        <div className="calendar-page__events-detail">
                            {enrichedEvent
                                ? <EventDetail event={enrichedEvent} />
                                : <div className="calendar-page__events-placeholder">
                                    <span>{t("selectEvent")}</span>
                                </div>
                            }
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default CalendarPage