import { createHash, randomBytes } from "crypto"

export function generateToken(): string {
    return randomBytes(32).toString('hex')
}

export function hashToken(raw: string): string {
    return createHash('sha256').update(raw).digest('hex')
}

export function parseBearer(header: string | undefined): string | null {
    if(!header || !header.startsWith('Bearer ')) return null
    const token = header.slice(7)
    return token.length > 0 ? token : null
}