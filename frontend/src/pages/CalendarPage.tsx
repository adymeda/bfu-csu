import clsx from "clsx"
import { useState } from "react"
import "@styles/pages/CalendarPage.scss"
import { useTranslation } from "react-i18next"
import { CalendarDaysIcon, ViewColumnsIcon, ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline"
import DayCalendar from "../components/calendar/DayCalendar"
import MonthCalendar from "../components/calendar/MonthCalendar"
import EventList from "../components/calendar/EventList"
import EventDetail from "../components/calendar/EventDetail"
import type { CalendarEvent, CalendarDeadline } from "../components/calendar/types"
import { toISODate, isSameDay, isSameMonth, addDays, addMonths, startOfMonth } from "@helpers"

function makeEventDate(offsetDays: number, h: number, m: number): Date {
    const d = new Date()
    d.setDate(d.getDate() + offsetDays)
    d.setHours(h, m, 0, 0)
    return d
}

const EVENTS: CalendarEvent[] = [
    {
        id: "1",
        startDate: makeEventDate(0, 8, 30),
        endDate: makeEventDate(0, 10, 0),
        title: "Переписка контрольных работ",
        place: "Ауд. 229",
        color: "#42a5f5",
        organizer: "Ишанов Сергей Александрович",
        description: "Переписка контрольной работы по дифференциальным уравнениям, последняя попытка. Аудитория 229",
        linkedMessage: {
            author: "Ишанов Сергей Александрович",
            title: "Переписка контрольных по дифференциальным уравнениям",
            text: "Следующая переписка контрольных работ по дифференциальным уравнениям пройдёт 14 апреля в 13:50, аудитория 229. Старосты должны предварительно предоставить списки переписываемых контрольных работ",
        },
    },
    {
        id: "2",
        startDate: makeEventDate(0, 12, 0),
        endDate: makeEventDate(0, 14, 0),
        title: "Общее собрание",
        place: "Ауд. 420",
        color: "#ab47bc",
    },
    {
        id: "3",
        startDate: makeEventDate(0, 14, 30),
        endDate: makeEventDate(0, 17, 0),
        title: "Экзамен",
        place: "Ауд. 123",
        color: "#ffa726",
    },
    {
        id: "4",
        startDate: makeEventDate(1, 10, 0),
        endDate: makeEventDate(1, 11, 30),
        title: "Семинар",
        place: "Ауд. 118",
        color: "#66bb6a",
    },
    {
        id: "5",
        startDate: makeEventDate(1, 14, 0),
        endDate: makeEventDate(1, 15, 0),
        title: "Консультация",
        place: "Ауд. 305",
        color: "#ef5350",
    },
    {
        id: "6",
        startDate: makeEventDate(3, 9, 0),
        endDate: makeEventDate(3, 12, 0),
        title: "Практика",
        place: "Лаб. 12",
        color: "#26c6da",
    },
    {
        id: "7",
        startDate: makeEventDate(-2, 11, 0),
        endDate: makeEventDate(-2, 13, 30),
        title: "Зачёт",
        place: "Ауд. 215",
        color: "#ffa726",
    },
    {
        id: "8",
        startDate: makeEventDate(5, 8, 30),
        endDate: makeEventDate(5, 10, 0),
        title: "Лекция",
        place: "Ауд. 101",
        color: "#42a5f5",
    },
    {
        id: "10",
        startDate: makeEventDate(7, 13, 0),
        endDate: makeEventDate(7, 15, 0),
        title: "Защита проекта",
        place: "Ауд. 310",
        color: "#ef5350",
    },
]

const DEADLINES: CalendarDeadline[] = [
    {
        id: "d1",
        title: "Сдача курсового проекта",
        date: makeEventDate(0, 18, 15),
    },
    {
        id: "d2",
        title: "Отчёт по практике",
        date: makeEventDate(1, 23, 59),
    },
    {
        id: "d3",
        title: "Лабораторная работа №3",
        date: makeEventDate(3, 12, 0),
    },
]

type View = "month" | "day"

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

    const eventsForDay = EVENTS.filter(e => toISODate(e.startDate) === toISODate(selectedDate))
    const deadlinesForDay = DEADLINES.filter(d => toISODate(d.date) === toISODate(selectedDate))
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
                            events={EVENTS}
                            deadlines={DEADLINES}
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
                            {selectedEvent
                                ? <EventDetail event={selectedEvent} />
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