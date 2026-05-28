import { QueryClient } from "@tanstack/react-query"

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 30_000,
            retry: (failureCount, error) => {
                // Don't retry auth/permission/not-found errors — only transient ones.
                const status = (error as { status?: number }).status ?? 0
                if(status >= 400 && status < 500) return false
                return failureCount < 2
            },
            refetchOnWindowFocus: false,
        },
    },
})
