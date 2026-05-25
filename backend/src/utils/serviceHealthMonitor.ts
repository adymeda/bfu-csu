import mlService from "../services/ml.service"
import telegramService from "../services/telegram.service"

const INTERVAL_MS = 60_000

interface ServiceCheck {
    name: string
    check: () => Promise<boolean>
}

const services: ServiceCheck[] = [
    { name: "ml", check: () => mlService.checkHealth() },
    { name: "telegram", check: () => telegramService.checkHealth() },
]

async function runChecks(): Promise<void> {
    const results = await Promise.all(
        services.map(async s => ({ name: s.name, ok: await s.check() }))
    )
    for (const { name, ok } of results) {
        if(ok) {
            console.log(`[health] ${name}: ok`)
        } else {
            console.warn(`[health] ${name}: unavailable (timed out or unreachable)`)
        }
    }
}

export function startServiceHealthMonitor(): void {
    void runChecks()
    setInterval(() => void runChecks(), INTERVAL_MS)
}