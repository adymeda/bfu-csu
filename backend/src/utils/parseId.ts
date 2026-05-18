export function parseId(raw: string | string[] | undefined): number | null {
    if(typeof raw !== "string") return null
    const n = parseInt(raw)
    return isNaN(n) ? null : n
}