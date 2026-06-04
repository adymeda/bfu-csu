import { useMutation, useQuery } from "@tanstack/react-query"
import { composeMessage, extractDeadline, extractEvent, summarizeInbox } from "../api/llm"

export function useComposeMessage() {
    return useMutation({
        mutationFn: (description: string) => composeMessage(description),
    })
}

export function useExtractEvent() {
    return useMutation({
        mutationFn: (text: string) => extractEvent(text),
    })
}

export function useExtractDeadline() {
    return useMutation({
        mutationFn: (text: string) => extractDeadline(text),
    })
}

export function useSummarizeInbox(enabled: boolean) {
    return useQuery({
        queryKey: ["inbox-summary"],
        queryFn: summarizeInbox,
        enabled,
        retry: false,
        staleTime: 60_000,
    })
}