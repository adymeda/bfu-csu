import clsx from "clsx"
import { useState } from "react"
import { ChevronDownIcon } from "@heroicons/react/24/outline"
import { StarIcon } from "@heroicons/react/24/solid"
import "@styles/components/ui/Tree.scss"
import type { TreeBranchProps, TreeProps } from "./types"
import Avatar from "./Avatar"

function TreeBranch({ node, selectedId, onSelect }: TreeBranchProps) {
    const [expanded, setExpanded] = useState(true)
    const hasChildren = !!node.children && node.children.length > 0
    const hasMembers = !!node.members && node.members.length > 0
    const isExpandable = hasMembers || hasChildren
    const isSelectable = !!onSelect
    const isSelected = selectedId !== undefined && node.id === selectedId

    function handleToggle(e: React.MouseEvent) {
        e.stopPropagation()
        setExpanded(!expanded)
    }

    function handleSelect() {
        if(onSelect) onSelect(node)
    }

    return (
        <div className="tree__branch">
            <div
                className={clsx(
                    "tree__branch-header",
                    isSelectable && "tree__branch-header--clickable",
                    isSelected && "tree__branch-header--selected"
                )}
                onClick={isSelectable ? handleSelect : undefined}
            >
                {isExpandable && (
                    <button
                        className={clsx("tree__branch-toggle", !expanded && "tree__branch-toggle--collapsed")}
                        onClick={handleToggle}
                    >
                        <ChevronDownIcon />
                    </button>
                )}
                <span className="tree__branch-title">{node.label}</span>
            </div>
            {isExpandable && expanded && (
                <div className="tree__branch-children">
                    {node.members?.map((member, i) => (
                        <div key={i} className="tree__branch-member">
                            <Avatar
                                placeholder={member.display_name}
                                color={`#${member.accent_color}`}
                                image={member.image}
                            />
                            <span className="tree__branch-member-name">{member.display_name}</span>
                            {member.isAdmin && <StarIcon className="tree__branch-member-admin" />}
                        </div>
                    ))}
                    {node.children?.map(child => (
                        <TreeBranch
                            key={child.id}
                            node={child}
                            selectedId={selectedId}
                            onSelect={onSelect}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

function Tree({ nodes, selectedId, onSelect }: TreeProps) {
    return (
        <div className="tree">
            {nodes.map(node => (
                <TreeBranch
                    key={node.id}
                    node={node}
                    selectedId={selectedId}
                    onSelect={onSelect}
                />
            ))}
        </div>
    )
}

export default Tree
