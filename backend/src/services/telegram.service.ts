class TelegramService {
    private readonly url = process.env["TELEGRAM_SERVICE_URL"] ?? ""
    private readonly token = process.env["TELEGRAM_SERVICE_TOKEN"] ?? ""
    private warnedMisconfigured = false

    private isMisconfigured(): boolean {
        if(!this.url || !this.token) {
            if(!this.warnedMisconfigured) {
                console.warn("[telegram] TELEGRAM_SERVICE_URL or TELEGRAM_SERVICE_TOKEN is not set, Telegram notifications are disabled")
                this.warnedMisconfigured = true
            }
            return true
        }
        return false
    }

    async notify(userIds: number[], text: string): Promise<{ sent: number, failed: number, missing_users: number[] } | null> {
        if(userIds.length === 0) return { sent: 0, failed: 0, missing_users: [] }
        if(this.isMisconfigured()) return null
        try {
            const res = await fetch(`${this.url}/api/notify`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${this.token}`,
                },
                body: JSON.stringify({ user_ids: userIds, text }),
                signal: AbortSignal.timeout(10000),
            })
            if(!res.ok) {
                console.warn(`[telegram] /api/notify returned ${res.status}`)
                return null
            }
            return await res.json() as { sent: number, failed: number, missing_users: number[] }
        } catch (err) {
            console.warn("[telegram] /api/notify unreachable:", (err as Error).message)
            return null
        }
    }

    async checkHealth(): Promise<boolean> {
        if(!this.url) return false
        try {
            const res = await fetch(`${this.url}/api/health`, {
                signal: AbortSignal.timeout(1500),
            })
            return res.ok
        } catch {
            return false
        }
    }
}

export default new TelegramService()