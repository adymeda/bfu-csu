import clsx from "clsx"
import "@styles/components/ui/Tabs.scss"
import type { TabsProps } from "./types"

function Tabs({ tabs, activeKey, onChange }: TabsProps) {
    return (
        <div className="tabs">
            {tabs.map(tab => (
                <button
                    key={tab.key}
                    className={clsx("tabs__tab", tab.key === activeKey && "tabs__tab--active")}
                    onClick={() => onChange(tab.key)}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    )
}

export default Tabs