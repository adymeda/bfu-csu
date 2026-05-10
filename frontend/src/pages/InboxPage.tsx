import { useRef, useState } from "react"
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline"
import { TagIcon } from "@heroicons/react/24/solid"
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
                        <input placeholder="Поиск..." />
                    </div>
                    <button className="inbox-sidebar__filter">
                        <TagIcon />
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
                    <Message author="Test" title="Тестовое сообщение" text="Какое-то тестовое сообщение, которое в дальнейшем будет убрано, изменено или, возможно, оставлено как есть. Просто делаем достаточно длинное сообщение, чтобы не писать здесь lorem ipsum."/>
                </div>
            </div>
            <div className="inbox-content">

            </div>
        </div>
    )
}

export default InboxPage