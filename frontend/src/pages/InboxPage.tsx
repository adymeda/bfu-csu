import { useRef, useState, useEffect } from "react"
import { EnvelopeIcon, MagnifyingGlassIcon, PencilSquareIcon } from "@heroicons/react/24/outline"
import "@styles/pages/InboxPage.scss"
import Message from "@components/inbox/Message"
import MessageDisplay from "@components/inbox/MessageDisplay"

const TABS = [
    { name: "Все", count: 3 },
    { name: "Избранное" },
    { name: "Мероприятия", count: 1 },
    { name: "Важное" },
]

function InboxPage() {
    const [activeTab, setActiveTab] = useState(0)
    const [currentMessageId, setCurrentMessageId] = useState<number | null>(null)
    const [isClosing, setIsClosing] = useState(false)
    const tabsRef = useRef<HTMLDivElement>(null)

    function handleWheel(e: React.WheelEvent<HTMLDivElement>) {
        if (tabsRef.current) {
            tabsRef.current.scrollLeft += e.deltaY
        }
    }

    function handleMessageClick(id: number) {
        setCurrentMessageId(id)
    }

    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            if (e.key !== "Escape" || currentMessageId === null) return
            handleClose()
        }
        document.addEventListener("keydown", onKeyDown)
        return () => document.removeEventListener("keydown", onKeyDown)
    }, [currentMessageId, isClosing])

    function handleClose() {
        if (window.matchMedia("(max-width: 768px)").matches) {
            setIsClosing(true)
            setTimeout(() => {
                setCurrentMessageId(null)
                setIsClosing(false)
            }, 250)
        } else {
            setCurrentMessageId(null)
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
                    <div className="inbox-sidebar__messages-date">
                        11 мая 2026
                    </div>
                    <div onClick={() => handleMessageClick(1)}>
                        <Message author="Ишанов Сергей Александрович" title="Переписка контрольных по дифференциальным уравнениям" text="Следующая переписка контрольных работ по дифференциальным уравнениям пройдёт 14 апреля в 13:50, аудитория 229. Старосты должны предварительно предоставить списки переписываемых контрольных работ" isRead={false} selected={currentMessageId === 1}/>
                    </div>
                </div>
            </div>
            <div className={`inbox-content${currentMessageId !== null && !isClosing ? " inbox-content--active" : ""}`}>
                {currentMessageId !== null
                ? <MessageDisplay author="Ишанов Сергей Александрович" title="Переписка контрольных по дифференциальным уравнениям" text="Следующая переписка контрольных работ по дифференциальным уравнениям пройдёт 14 апреля в 13:50, аудитория 229. Старосты должны предварительно предоставить списки переписываемых контрольных работ" onClose={handleClose}/>
                : <div className="inbox-content__empty">
                    <EnvelopeIcon />
                    <span>Нажмите на сообщение слева, чтобы открыть его</span>    
                </div>
                }
            </div>
        </div>
    )
}

export default InboxPage