class MlService {
    private readonly url = process.env["ML_SERVICE_URL"] ?? ""
    private readonly token = process.env["ML_SERVICE_TOKEN"] ?? ""
    private warnedMisconfigured = false

    private isMisconfigured(): boolean {
        if(!this.url || !this.token) {
            if(!this.warnedMisconfigured) {
                console.warn("[ml] ML_SERVICE_URL or ML_SERVICE_TOKEN is not set, ML checks are disabled")
                this.warnedMisconfigured = true
            }
            return true
        }
        return false
    }

    async checkToxicity(text: string): Promise<{ toxic: boolean, score: number } | null> {
        if(this.isMisconfigured()) return null
        try {
            const res = await fetch(`${this.url}/api/check`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${this.token}`,
                },
                body: JSON.stringify({ text }),
                signal: AbortSignal.timeout(3000),
            })
            if(!res.ok) {
                console.warn(`[ml] /api/check returned ${res.status}, allowing message through`)
                return null
            }
            return await res.json() as { toxic: boolean, score: number }
        } catch (err) {
            console.warn("[ml] /api/check unreachable:", (err as Error).message, "\nallowing message through")
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

export default new MlService()