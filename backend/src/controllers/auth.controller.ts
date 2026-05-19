import { Request, Response, NextFunction } from "express"
import service from "../services/auth.service"
import { parseBearer } from "../utils/token"
import type { RegisterDto, LoginDto } from "../types/auth"

class AuthController {
    async register(req: Request, res: Response, next: NextFunction) {
        const { email, password, display_name } = req.body as RegisterDto

        if(!email) return res.status(400).json({
            error: "email should be specified"
        })

        if(!password) return res.status(400).json({
            error: "password should be specified"
        })
        if(!display_name) return res.status(400).json({
            error: "display_name should be specified"
        })

        const dto: RegisterDto = { email, password, display_name }
        if((req.body as RegisterDto).remember === true) dto.remember = true

        try {
            const result = await service.register(dto)
            res.status(201).json(result)
        } catch (err: unknown) {
            const pg = err as { code?: string }
            if(pg.code === '23505') {
                res.status(409).json({
                    error: "email already claimed"
                })
            } else next(err)
        }
    }

    async login(req: Request, res: Response, next: NextFunction) {
        const { email, password } = req.body as LoginDto

        if(!email) return res.status(400).json({
            error: "email should be specified"
        })
        if(!password) return res.status(400).json({
            error: "password should be specified"
        })

        const dto: LoginDto = { email, password }
        if((req.body as LoginDto).remember === true) dto.remember = true

        try {
            const result = await service.login(dto)
            if(!result) return res.status(401).json({
                error: "invalid credentials"
            })
            res.json(result)
        } catch(err) {
            next(err)
        }
    }

    async logout(req: Request, res: Response, next: NextFunction) {
        const token = parseBearer(req.headers.authorization)
        if(!token) return res.status(401).json({
            error: "No token provided"
        })

        try {
            await service.logout(token)
            res.status(204).send()
        } catch(err) {
            next(err)
        }
    }

    async me(req: Request, res: Response, next: NextFunction) {
        const userId = res.locals.userId as number
        try {
            const user = await service.me(userId)
            if(!user) return res.status(404).json({ error: "User not found" })
            res.json(user)
        } catch(err) {
            next(err)
        }
    }
}

export default new AuthController()