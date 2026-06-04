import type { CategorizeMessageResponse, ComposeMessageResponse, ExtractDeadlineResponse, ExtractEventResponse, SummarizeInboxResponse, CalendarPlanResponse, CalendarAnswerResponse, CalendarEventRef, CalendarDeadlineRef, LlmToxicityResponse, RephraseResponse } from "../types/llm"

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

	async categorizeMessage(subject: string, body: string): Promise<CategorizeMessageResponse | null> {
		if(this.isMisconfigured()) return null
		try {
			const res = await fetch(`${this.url}/api/llm/categorize-message`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"Authorization": `Bearer ${this.token}`,
				},
				body: JSON.stringify({ subject, body }),
				signal: AbortSignal.timeout(30000),
			})
			if(!res.ok) {
				console.warn(`[ml] /api/llm/categorize-message returned ${res.status}, skipping categorization`)
				return null
			}
			return await res.json() as CategorizeMessageResponse
		} catch (err) {
			console.warn("[ml] /api/llm/categorize-message unreachable:", (err as Error).message, "\nskipping categorization")
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

	async composeMessage(description: string, authorGroups: string[]): Promise<ComposeMessageResponse> {
		if(this.isMisconfigured()) throw new Error("ML service is not configured")
		const res = await fetch(`${this.url}/api/llm/compose-message`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Authorization": `Bearer ${this.token}`,
			},
			body: JSON.stringify({ description, author_groups: authorGroups }),
			signal: AbortSignal.timeout(30000),
		})
		if(!res.ok) {
			const body = await res.text().catch(() => "")
			throw new Error(`[ml] /api/llm/compose-message returned ${res.status}: ${body}`)
		}
		return await res.json() as ComposeMessageResponse
	}

	async extractEvent(text: string): Promise<ExtractEventResponse> {
		if(this.isMisconfigured()) throw new Error("ML service is not configured")
		const res = await fetch(`${this.url}/api/llm/extract-event`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Authorization": `Bearer ${this.token}`,
			},
			body: JSON.stringify({ text }),
			signal: AbortSignal.timeout(30000),
		})
		if(!res.ok) {
			const body = await res.text().catch(() => "")
			throw new Error(`[ml] /api/llm/extract-event returned ${res.status}: ${body}`)
		}
		return await res.json() as ExtractEventResponse
	}

	async extractDeadline(text: string): Promise<ExtractDeadlineResponse> {
		if(this.isMisconfigured()) throw new Error("ML service is not configured")
		const res = await fetch(`${this.url}/api/llm/extract-deadline`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Authorization": `Bearer ${this.token}`,
			},
			body: JSON.stringify({ text }),
			signal: AbortSignal.timeout(30000),
		})
		if(!res.ok) {
			const body = await res.text().catch(() => "")
			throw new Error(`[ml] /api/llm/extract-deadline returned ${res.status}: ${body}`)
		}
		return await res.json() as ExtractDeadlineResponse
	}

	// LLM-level toxicity arbitration (fail-open: returns null on error)
	async checkToxicityLlm(text: string, score: number): Promise<LlmToxicityResponse | null> {
		if(this.isMisconfigured()) return null
		try {
			const res = await fetch(`${this.url}/api/llm/check-toxicity`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"Authorization": `Bearer ${this.token}`,
				},
				body: JSON.stringify({ text, score }),
				signal: AbortSignal.timeout(30000),
			})
			if(!res.ok) {
				console.warn(`[ml] /api/llm/check-toxicity returned ${res.status}, allowing message through`)
				return null
			}
			return await res.json() as LlmToxicityResponse
		} catch (err) {
			console.warn("[ml] /api/llm/check-toxicity unreachable:", (err as Error).message, "\nallowing message through")
			return null
		}
	}

	async rephrase(text: string): Promise<RephraseResponse> {
		if(this.isMisconfigured()) throw new Error("ML service is not configured")
		const res = await fetch(`${this.url}/api/llm/rephrase`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Authorization": `Bearer ${this.token}`,
			},
			body: JSON.stringify({ text }),
			signal: AbortSignal.timeout(30000),
		})
		if(!res.ok) {
			const body = await res.text().catch(() => "")
			throw new Error(`[ml] /api/llm/rephrase returned ${res.status}: ${body}`)
		}
		return await res.json() as RephraseResponse
	}

	async calendarPlan(question: string): Promise<CalendarPlanResponse> {
		if(this.isMisconfigured()) throw new Error("ML service is not configured")
		const res = await fetch(`${this.url}/api/llm/calendar-plan`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Authorization": `Bearer ${this.token}`,
			},
			body: JSON.stringify({ question }),
			signal: AbortSignal.timeout(30000),
		})
		if(!res.ok) {
			const body = await res.text().catch(() => "")
			throw new Error(`[ml] /api/llm/calendar-plan returned ${res.status}: ${body}`)
		}
		return await res.json() as CalendarPlanResponse
	}

	async calendarAnswer(question: string, events: CalendarEventRef[], deadlines: CalendarDeadlineRef[]): Promise<CalendarAnswerResponse> {
		if(this.isMisconfigured()) throw new Error("ML service is not configured")
		const res = await fetch(`${this.url}/api/llm/calendar-answer`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Authorization": `Bearer ${this.token}`,
			},
			body: JSON.stringify({ question, events, deadlines }),
			signal: AbortSignal.timeout(30000),
		})
		if(!res.ok) {
			const body = await res.text().catch(() => "")
			throw new Error(`[ml] /api/llm/calendar-answer returned ${res.status}: ${body}`)
		}
		return await res.json() as CalendarAnswerResponse
	}

	async summarizeInbox(messages: { sender_name: string, body: string, created_at: string, is_read: boolean, category: string | null, requires_response: boolean | null }[]): Promise<SummarizeInboxResponse> {
		if(this.isMisconfigured()) throw new Error("ML service is not configured")
		const res = await fetch(`${this.url}/api/llm/summarize-inbox`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Authorization": `Bearer ${this.token}`,
			},
			body: JSON.stringify({ messages }),
			signal: AbortSignal.timeout(30000),
		})
		if(!res.ok) {
			const body = await res.text().catch(() => "")
			throw new Error(`[ml] /api/llm/summarize-inbox returned ${res.status}: ${body}`)
		}
		return await res.json() as SummarizeInboxResponse
	}
}

export default new MlService()