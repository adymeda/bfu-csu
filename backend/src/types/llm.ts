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
	is_deadline: boolean
	title: string | null
	start_at: string | null
	end_at: string | null
	location: string | null
}

export interface SummarizeInboxResponse {
	summary: string
}

// Resolved types returned to frontend

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

export interface ExtractResult {
	is_deadline: boolean
	title: string | null
	start_at: string | null
	end_at: string | null
}

export interface SummarizeResult {
	summary: string
}
