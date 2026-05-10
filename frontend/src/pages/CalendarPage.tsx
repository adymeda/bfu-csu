import "@styles/pages/CalendarPage.scss"
import DayCalendar from "../components/calendar/DayCalendar"
import type { CalendarEvent } from "../components/calendar/types"

const MOCK_EVENTS: CalendarEvent[] = [
    {
        id: "1",
        title: "Лекция",
        startTime: "8:30",
        endTime: "10:00",
        color: "#42a5f5",
    },
    {
        id: "2",
        title: "Общее собрание",
        startTime: "12:00",
        endTime: "14:00",
        color: "#ab47bc",
    },
    {
        id: "3",
        title: "Экзамен",
        startTime: "14:30",
        endTime: "17:00",
        color: "#ffa726",
    },
]

function CalendarPage() {
    return (
        <>
            <div className="calendar-page__titlebar">
                <div className="calendar-page__title">
                    <span className="calendar-page__title-text">Календарь</span>
                    <span className="calendar-page__title-info">
                        {MOCK_EVENTS.length} мероприятия сегодня
                    </span>
                </div>
            </div>

            <div className="calendar-page__content">
                <DayCalendar events={MOCK_EVENTS} />
            </div>
        </>
    )
}

export default CalendarPage
