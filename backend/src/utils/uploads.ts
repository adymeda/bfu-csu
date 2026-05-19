import path from "path"
import fs from "fs"
import multer from "multer"

export const UPLOAD_DIR = path.resolve(process.env["UPLOAD_DIR"] ?? "./uploads")
export const MAX_FILE_SIZE = 10 * 1024 * 1024
export const MAX_FILES = 5

export const ALLOWED_MIME = new Set([
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/gif",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
    "application/zip",
])

fs.mkdirSync(UPLOAD_DIR, { recursive: true })

export const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_FILE_SIZE, files: MAX_FILES },
    fileFilter(_req, file, cb) {
        if(ALLOWED_MIME.has(file.mimetype)) {
            cb(null, true)
        } else {
            cb(Object.assign(new Error("File type not allowed"), { code: "MIME_NOT_ALLOWED" }))
        }
    },
})

export function resolveStoragePath(storageName: string): string {
    if(!/^[a-f0-9]{64}$/.test(storageName)) throw new Error("Invalid storage name")
    return path.join(UPLOAD_DIR, storageName)
}