import { Request, Response } from "express"
import service from "../services/auth.service"
import { parseBearer } from "../utils/token"
import type { RegisterDto, LoginDto } from "../types/auth"

class AuthController {
    async register(req: Request, res: Response) {
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
            } else res.status(500).json({
                error: "Internal Server Error"
            })
        }
    }

    async login(req: Request, res: Response) {
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
        } catch {
            res.status(500).json({
                error: "Internal Server Error"
            })
        }
    }

    async logout(req: Request, res: Response) {
        const token = parseBearer(req.headers.authorization)
        if(!token) return res.status(401).json({
            error: "No token provided"
        })

        try {
            await service.logout(token)
            res.status(204).send()
        } catch {
            res.status(500).json({ error: "Internal Server Error" })
        }
    }
}

export default new AuthController()