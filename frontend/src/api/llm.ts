import { apiFetch } from "./client"
import type { ComposeResult, ExtractDeadlineResult, ExtractEventResult, SummarizeResult, CalendarAskResult, RephraseResult } from "./types"

export function composeMessage(description: string): Promise<ComposeResult> {
    return apiFetch<ComposeResult>("/llm/compose-message", {
        method: "POST",
        body: JSON.stringify({ description }),
    })
}

export function extractEvent(text: string): Promise<ExtractEventResult> {
    return apiFetch<ExtractEventResult>("/llm/extract-event", {
        method: "POST",
        body: JSON.stringify({ text }),
        signal: AbortSignal.timeout(10000),
    })
}

export function extractDeadline(text: string): Promise<ExtractDeadlineResult> {
    return apiFetch<ExtractDeadlineResult>("/llm/extract-deadline", {
        method: "POST",
        body: JSON.stringify({ text }),
        signal: AbortSignal.timeout(10000),
    })
}

export function summarizeInbox(): Promise<SummarizeResult> {
    return apiFetch<SummarizeResult>("/llm/summarize-inbox", {
        method: "POST",
    })
}

export function askCalendar(question: string): Promise<CalendarAskResult> {
    return apiFetch<CalendarAskResult>("/calendar/ask", {
        method: "POST",
        body: JSON.stringify({ question }),
        signal: AbortSignal.timeout(30000),
    })
}

export function rephrase(text: string): Promise<RephraseResult> {
    return apiFetch<RephraseResult>("/messages/rephrase", {
        method: "POST",
        body: JSON.stringify({ text }),
        signal: AbortSignal.timeout(30000),
    })
}