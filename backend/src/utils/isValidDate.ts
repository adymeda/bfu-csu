export function isValidDate(value: any): boolean {
	return typeof value === "string" && !isNaN(new Date(value).getTime())
}