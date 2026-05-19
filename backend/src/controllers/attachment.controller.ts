import { Request, Response, NextFunction } from "express"
import fs from "fs"
import service from "../services/attachment.service"
import { parseId } from "../utils/parseId"
import { resolveStoragePath } from "../utils/uploads"

class AttachmentController {
    async upload(req: Request, res: Response, next: NextFunction) {
        const files = req.files as Express.Multer.File[] | undefined
        if(!files || files.length === 0)
            return res.status(400).json({ error: "No files provided" })

        const userId = res.locals.userId as number

        try {
            const result = await service.upload(files, userId)
            res.status(201).json(result)
        } catch(err) {
            next(err)
        }
    }

    async download(req: Request, res: Response, next: NextFunction) {
        const id = parseId(req.params["id"])
        if(id === null) return res.status(400).json({ error: "id should be an integer" })

        const userId = res.locals.userId as number

        try {
            const info = await service.getForDownload(id, userId)
            if(!info) return res.status(404).json({ error: "Attachment not found" })

            const absPath = resolveStoragePath(info.storageName)
            if(!fs.existsSync(absPath)) return res.status(404).json({ error: "Attachment not found" })

            const safeName = info.original_name.replace(/[\r\n"]/g, "_")
            const encodedName = encodeURIComponent(info.original_name)
            res.setHeader("Content-Type", info.mime_type)
            res.setHeader("Content-Disposition", `attachment; filename="${safeName}"; filename*=UTF-8''${encodedName}`)
            res.sendFile(absPath)
        } catch(err) {
            next(err)
        }
    }
}

export default new AttachmentController()