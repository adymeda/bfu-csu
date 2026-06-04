import mlService from "./ml.service"
import userRepo from "../repositories/user.repo"
import groupRepo from "../repositories/group.repo"
import messageRepo from "../repositories/message.repo"
import eventService from "./event.service"
import deadlineService from "./deadline.service"
import type { ComposeResult, ExtractDeadlineResult, ExtractEventResult, SummarizeResult, CalendarAskResult } from "../types/llm"

const TOX_LOW = Number(process.env["TOX_SCORE_LOW"] ?? 0.35)
const TOX_HIGH = Number(process.env["TOX_SCORE_HIGH"] ?? 0.65)

class LlmService {
    private async resolveGroup(ref: string): Promise<{ id: number, name: string } | null> {
        const parts = ref.split("/")
        if(parts.length === 1) {
            const name = parts[0]!
            const id = await groupRepo.resolveByName(name)
            if(id === null) return null
            const group = await groupRepo.findById(id)
            return group ? { id: group.id, name: group.name } : null
        }

        let currentParent = parts[0]!
        let currentId: number | null = null

        for(let i = 1; i < parts.length; i++) {
            const child = parts[i]!
            const id = await groupRepo.resolveByPath(currentParent, child)
            if(id === null) return null
            currentParent = child
            currentId = id
        }

        if(currentId === null) return null
        const group = await groupRepo.findById(currentId)
        return group ? { id: group.id, name: group.name } : null
    }

    async compose(userId: number, description: string): Promise<ComposeResult> {
        const userGroups = await userRepo.findGroups(userId)
        const authorGroups = userGroups.map(g => g.name)

        // Инструкция здороваться
        description = description + "\nНе забудь поздороваться"

        const resp = await mlService.composeMessage(description, authorGroups)

        const warnings: string[] = [...resp.warnings]
        const seen = new Set<string>()
        const recipients: ComposeResult["recipients"] = []

        function dedupeKey(type: 0 | 1, id: number) {
            return `${type}:${id}`
        }

        function addRecipient(type: 0 | 1, id: number, name: string) {
            const key = dedupeKey(type, id)
            if(seen.has(key)) return
            seen.add(key)
            recipients.push({ type, id, name })
        }

        // ФИО
        for(const fullName of resp.users) {
            const user = await userRepo.findByDisplayName(fullName)
            if(user) {
                addRecipient(0, user.id, user.display_name)
            } else {
                warnings.push(`Пользователь «${fullName}» не найден в системе`)
            }
        }

        // Группы
        for(const groupRef of resp.groups) {
            const result = await this.resolveGroup(groupRef)
            if(result) {
                addRecipient(1, result.id, result.name)
            } else {
                warnings.push(`Группа «${groupRef}» не найдена в системе`)
            }
        }

        // Должности
        for(const emp of resp.employees) {
            const groupResult = await this.resolveGroup(emp.group)
            if(!groupResult) {
                warnings.push(`Группа «${emp.group}» для должности «${emp.position}» не найдена`)
                continue
            }
            const userId = await groupRepo.findUserByPosition(groupResult.id, emp.position)
            if(userId !== null) {
                const user = await userRepo.findById(userId)
                if(user) {
                    addRecipient(0, user.id, user.display_name)
                } else {
                    warnings.push(`Пользователь с должностью «${emp.position}» в «${emp.group}» не найден`)
                }
            } else {
                warnings.push(`Должность «${emp.position}» не найдена в группе «${emp.group}»`)
            }
        }

        return {
            subject: resp.subject,
            body: resp.body,
            recipients,
            warnings,
        }
    }

    async extractEvent(text: string): Promise<ExtractEventResult> {
        const resp = await mlService.extractEvent(text)
        return {
            title: resp.title,
            start_at: resp.start_at,
            end_at: resp.end_at,
        }
    }

    async extractDeadline(text: string): Promise<ExtractDeadlineResult> {
        const resp = await mlService.extractDeadline(text)
        return {
            title: resp.title,
            due_at: resp.due_at,
        }
    }

    // Two-level toxicity moderation. Fail-open: if ml-service is down, returns { rejected: false }.
    async moderate(title: string, content: string): Promise<{ rejected: boolean }> {
        const text = `${title}\n${content}`
        const level1 = await mlService.checkToxicity(text)
        if(level1 === null) return { rejected: false }
        if(level1.score < TOX_LOW) return { rejected: false }
        if(level1.score > TOX_HIGH) return { rejected: true }
        // Borderline: ask LLM for arbitration
        const level2 = await mlService.checkToxicityLlm(content, level1.score)
        return { rejected: level2?.toxic === true }
    }

    async rephrase(text: string): Promise<{ text: string }> {
        const resp = await mlService.rephrase(text)
        return { text: resp.text }
    }

    async askCalendar(userId: number, question: string): Promise<CalendarAskResult> {
        const plan = await mlService.calendarPlan(question)

        const fromTs = `${plan.date_from}T00:00:00+02:00`
        const toTs = `${plan.date_to}T23:59:59.999+02:00`

        const events = plan.need_events
            ? (await eventService.findByUser(userId, fromTs, toTs)).map(e => ({
                title: e.title,
                start_at: e.start_at instanceof Date ? e.start_at.toISOString() : String(e.start_at),
                end_at: e.end_at ? (e.end_at instanceof Date ? e.end_at.toISOString() : String(e.end_at)) : null,
            }))
            : []

        const deadlines = plan.need_deadlines
            ? (await deadlineService.findByUser(userId, fromTs, toTs)).map(d => ({
                title: d.title,
                due_at: d.due_at instanceof Date ? d.due_at.toISOString() : String(d.due_at),
            }))
            : []

        const resp = await mlService.calendarAnswer(question, events, deadlines)
        const answer = resp.answer
            .replace(/<br\s*\/?>/gi, "\n")
            .replace(/\b(\d{4})-(\d{2})-(\d{2})\b/g, "$3.$2.$1")
        return { answer }
    }

    async summarize(userId: number): Promise<SummarizeResult> {
        const items = await messageRepo.findListByUser(userId, {
            box: "inbox",
            limit: 10,
            before: null,
            favorite: false,
            unread: false,
            category: null,
            requires_response: false,
            has_events: false,
            has_deadlines: false,
        })

        const messages = items.map(item => ({
            sender_name: item.sender.display_name,
            body: item.content,
            created_at: item.created_at.toISOString(),
            is_read: item.is_read,
            category: item.category,
            requires_response: item.requires_response,
        }))

        const resp = await mlService.summarizeInbox(messages)
        return { summary: resp.summary }
    }
}

export default new LlmService()