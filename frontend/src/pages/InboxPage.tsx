import { useRef, useState } from "react"
import { MagnifyingGlassIcon, PencilSquareIcon } from "@heroicons/react/24/outline"
import "@styles/pages/InboxPage.scss"
import Message from "@components/inbox/Message"

const TABS = [
    { name: "Все", count: 3 },
    { name: "Избранное" },
    { name: "Мероприятия", count: 1 },
    { name: "Важное" },
]

function InboxPage() {
    const [activeTab, setActiveTab] = useState(0)
    const tabsRef = useRef<HTMLDivElement>(null)

    function handleWheel(e: React.WheelEvent<HTMLDivElement>) {
        if (tabsRef.current) {
            tabsRef.current.scrollLeft += e.deltaY
        }
    }

    return (
        <div className="inbox">
            <div className="inbox-sidebar">
                <div className="inbox-sidebar__header">
                    <div className="inbox-sidebar__search">
                        <MagnifyingGlassIcon />
                        <input placeholder="Поиск по имени, содержанию..." />
                    </div>
                    <button className="inbox-sidebar__new-message">
                        <PencilSquareIcon />
                    </button>
                </div>

                <div className="inbox-sidebar__tabs" ref={tabsRef} onWheel={handleWheel}>
                    {TABS.map((tab, i) => (
                        <div
                            key={tab.name}
                            className={`inbox-sidebar__tab${activeTab === i ? " active" : ""}`}
                            onClick={() => setActiveTab(i)}
                        >
                            <span className="inbox-sidebar__tab-name">{tab.name}</span>
                            {tab.count !== undefined && (
                                <span className="inbox-sidebar__tab-count">{tab.count}</span>
                            )}
                        </div>
                    ))}
                </div>

                <div className="inbox-sidebar__messages">
                    <Message author="Ишанов Сергей Александрович" title="Переписка контрольных по дифференциальным уравнениям" text="Следующая переписка контрольных работ по дифференциальным уравнениям пройдёт 14 апреля в 13:50, аудитория 229. Старосты должны предварительно предоставить списки переписываемых контрольных работ" isRead={false}/>
                </div>
            </div>
            <div className="inbox-content">

            </div>
        </div>
    )
}

export default InboxPage