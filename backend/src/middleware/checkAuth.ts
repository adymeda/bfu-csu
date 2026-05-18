import { Request, Response, NextFunction } from "express"
import { parseBearer, hashToken } from "../utils/token"
import authRepo from "../repositories/auth.repo"

export async function checkAuth(req: Request, res: Response, next: NextFunction): Promise<any> {
	const raw = parseBearer(req.headers.authorization)
	if(!raw) return res.status(401).json({
		error: "No token provided"
	})


	try {
		const session = await authRepo.findByTokenHash(hashToken(raw))
		if(!session || session.expires_at < new Date()) return res.status(401).json({
			error: "invalid or expired token"
		})

		next()
	} catch {
		res.status(500).json({
			error: "Internal Server Error"
		})
	}
}