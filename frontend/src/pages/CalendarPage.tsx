import "@styles/pages/CalendarPage.scss"

function CalendarPage() {
    return (
        <>
            <div className="calendar-page__titlebar">
                <div className="calendar-page__title">
                    <span className="calendar-page__title-text">Календарь</span>
                    <span className="calendar-page__title-info">3 мероприятия сегодня</span>
                </div>
            </div>

            <div className="calendar-page__content">
                <div className="calendar-page__timeline">
                    
                </div>
                <div className="calendar-page__event-list">
                    <div className="event-card">

                    </div>
                </div>
            </div>
        </>
    )
}

export default CalendarPage