import { apiFetch, getToken } from "./client"
import type { AttachmentPublic } from "./types"

export function uploadAttachments(files: File[]): Promise<AttachmentPublic[]> {
    const form = new FormData()
    for(const file of files) form.append("files", file)
    return apiFetch<AttachmentPublic[]>("/attachments", {
        method: "POST",
        body: form
    })
}

// Downloads need the Bearer header, so a plain <a href> won't work — fetch the
// blob with auth and trigger a browser download.
export async function downloadAttachment(att: AttachmentPublic): Promise<void> {
    const token = getToken()
    const res = await fetch(`/api/attachments/${att.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
    if(!res.ok) throw new Error("download failed")
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = att.original_name
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
}

export function formatBytes(bytes: number): string {
    if(bytes < 1024) return `${bytes} Б`
    if(bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} КБ`
    return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`
}
