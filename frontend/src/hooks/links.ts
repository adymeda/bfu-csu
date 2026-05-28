import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { getLinks, linkTelegram, deleteLink, TELEGRAM_LINK_TYPE } from "../api/links"

export function useLinks() {
    return useQuery({
        queryKey: ["links"],
        queryFn: getLinks
    })
}

export function useLinkTelegram() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (code: string) => linkTelegram(code),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["links"] })
    })
}

export function useDeleteLink() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (linkType: number = TELEGRAM_LINK_TYPE) => deleteLink(linkType),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["links"] })
    })
}
