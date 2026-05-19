import { Request, Response, NextFunction } from "express"

export default function errorHandler(_: any, _req: Request, res: Response, _next: NextFunction) {
    res.status(500).json({
        error: "Internal Server Error"
    })
}