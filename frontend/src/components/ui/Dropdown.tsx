import { useState, useRef, useEffect } from "react";
import "@styles/ui/Dropdown.scss";
import type { DropdownProps } from "./types";

export default function Dropdown({ trigger, children, className, triggerClassName }: DropdownProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handler = (e: MouseEvent) => {
			if (ref.current && !ref.current.contains(e.target as Node)) {
				setIsOpen(false);
			}
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, []);

	const toggle = () => {
		if (!isOpen && ref.current) {
			const { left, width } = ref.current.getBoundingClientRect();
			const triggerCenter = left + width / 2;
			const alignRight = triggerCenter > window.innerWidth / 2;
			setMenuStyle({
				"--dropdown-left": alignRight ? "auto" : "0",
				"--dropdown-right": alignRight ? "0" : "auto",
			} as React.CSSProperties);
		}
		setIsOpen((v) => !v);
	};

	return (
		<div ref={ref} className="dropdown">
			<div
			  className={`dropdown__trigger${triggerClassName ? ` ${triggerClassName}` : ""}`}
			  onClick={toggle}>
				{trigger}
			</div>
			{isOpen && (
				<div
				  className={`dropdown__menu${className ? ` ${className}` : ""}`}
				  style={menuStyle}>
					{children}
				</div>
			)}
		</div>
	);
}