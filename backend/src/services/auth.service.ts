import bcrypt from "bcryptjs"
import userRepo from "../repositories/user.repo"
import authRepo from "../repositories/auth.repo"
import userService from "./user.service"
import { generateToken, hashToken } from "../utils/token"
import type { LoginDto, RegisterDto, AuthResponse } from "../types/auth"
import type { User } from "../types/user"

const DAY = 86_400_000
const REMEMBER_TTL = 30 * DAY

class AuthService {
    private async createSession(userId: number, remember: boolean): Promise<string> {
        const raw = generateToken()
        const token_hash = hashToken(raw)
        const expires_at = new Date(Date.now() + (remember ? REMEMBER_TTL : DAY))
        await authRepo.createSession(userId, token_hash, expires_at)
        return raw
    }

    async register(dto: RegisterDto): Promise<AuthResponse> {
        const user = await userService.register({
            email: dto.email,
            password: dto.password,
            display_name: dto.display_name,
        })
        const token = await this.createSession(user.id, dto.remember === true)
        return { token, user }
    }

    async login(dto: LoginDto): Promise<AuthResponse | null> {
        const row = await userRepo.getLoginData(dto.email)
        if(!row) return null

        const match = await bcrypt.compare(dto.password, row.password)
        if(!match) return null

        await userRepo.updateLastLogin(row.id)

        const { password, ...user } = row
        void password

        const token = await this.createSession(user.id, dto.remember === true)
        return { token, user }
    }

    async logout(rawToken: string): Promise<boolean> {
        return authRepo.deleteByTokenHash(hashToken(rawToken))
    }

    async me(userId: number): Promise<User | null> {
        return userService.getUserById(userId)
    }
}

export default new AuthService()