import { MagnifyingGlassIcon } from "@heroicons/react/24/outline"
import { TagIcon } from "@heroicons/react/24/solid"
import "@styles/pages/InboxPage.scss"

function InboxPage() {
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
            </div>
            <div className="inbox-content">

            </div>
        </div>
    )
}

export default InboxPage