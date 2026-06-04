export interface EmployeeRef {
	position: string
	group: string
}

export interface ComposeMessageResponse {
	subject: string
	body: string
	users: string[]
	groups: string[]
	employees: EmployeeRef[]
	warnings: string[]
}

export interface ExtractEventResponse {
	title: string | null
	start_at: string | null
	end_at: string | null
	location: string | null
}

export interface ExtractDeadlineResponse {
	title: string | null
	due_at: string | null
}

export interface SummarizeInboxResponse {
	summary: string
}

export interface CategorizeMessageResponse {
	category: string
	requires_response: boolean
}


export interface ResolvedRecipient {
	type: 0 | 1
	id: number
	name: string
}

export interface ComposeResult {
	subject: string
	body: string
	recipients: ResolvedRecipient[]
	warnings: string[]
}

export interface ExtractEventResult {
	title: string | null
	start_at: string | null
	end_at: string | null
}

export interface ExtractDeadlineResult {
	title: string | null
	due_at: string | null
}

export interface SummarizeResult {
	summary: string
}
