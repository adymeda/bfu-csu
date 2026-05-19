import { Router, Request, Response, NextFunction } from "express"
import { MulterError } from "multer"
import { checkAuth } from "../middleware/checkAuth"
import controller from "../controllers/attachment.controller"
import { upload, MAX_FILE_SIZE, MAX_FILES } from "../utils/uploads"

const router = Router()

function useMulter(handler: (req: Request, res: Response, next: NextFunction) => void) {
    return (req: Request, res: Response, next: NextFunction) => {
        upload.array("files", MAX_FILES)(req, res, (err) => {
            if(err instanceof MulterError) {
                let message = "File upload error"
                if(err.code === "LIMIT_FILE_SIZE")
                    message = `File too large (max ${MAX_FILE_SIZE / 1024 / 1024} MB)`
                if(err.code === "LIMIT_FILE_COUNT")
                    message = `Too many files (max ${MAX_FILES})`
                if(err.code === "LIMIT_UNEXPECTED_FILE")
                    message = "Unexpected field name, use \"files\""
                return res.status(400).json({ error: message })
            }
            if(err) {
                if((err as { code?: string }).code === "MIME_NOT_ALLOWED")
                    return res.status(400).json({ error: "File type not allowed" })
                return next(err)
            }
            handler(req, res, next)
        })
    }
}

router.post("/", checkAuth, useMulter(controller.upload.bind(controller)))
router.get("/:id", checkAuth, controller.download.bind(controller))

export default router