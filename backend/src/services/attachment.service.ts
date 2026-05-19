import fs from "fs/promises"
import repo from "../repositories/attachment.repo"
import { resolveStoragePath } from "../utils/uploads"
import type { AttachmentPublic } from "../types/attachment"

interface UploadFile {
    originalname: string
    mimetype: string
    size: number
    buffer: Buffer
}

class AttachmentService {
    async upload(files: UploadFile[], uploaderId: number): Promise<AttachmentPublic[]> {
        const results: AttachmentPublic[] = []
        const written: string[] = []

        for(const file of files) {
            const row = await repo.create({
                uploader_id: uploaderId,
                original_name: file.originalname,
                mime_type: file.mimetype,
                size_bytes: file.size,
            })
            const filePath = resolveStoragePath(row.storage_name)
            try {
                await fs.writeFile(filePath, file.buffer)
                written.push(filePath)
            } catch(err) {
                for(const p of written) await fs.unlink(p).catch(() => undefined)
                throw err
            }
            results.push({
                id: row.id,
                original_name: row.original_name,
                mime_type: row.mime_type,
                size_bytes: row.size_bytes,
            })
        }

        return results
    }

    async getForDownload(id: number, userId: number): Promise<{ storageName: string, original_name: string, mime_type: string } | null> {
        const attachment = await repo.findById(id)
        if(!attachment) return null

        const ok = await repo.userCanAccess(id, userId)
        if(!ok) return null

        return {
            storageName: attachment.storage_name,
            original_name: attachment.original_name,
            mime_type: attachment.mime_type,
        }
    }
}

export default new AttachmentService()