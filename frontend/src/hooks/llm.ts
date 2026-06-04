import { useMutation } from "@tanstack/react-query"
import { composeMessage, extractDeadline, extractEvent } from "../api/llm"

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