import jwt, { SignOptions } from 'jsonwebtoken'
import crypto from 'crypto'
import type { JWTpayload } from '../types/auth.types'

// ACCESS TOKEN
export const signAccessToken = (userId: string, role: string): string => {
    const options: SignOptions = {
        expiresIn: (process.env.JWT_EXPIRES_IN as SignOptions['expiresIn']) ?? '15m'

    }

    return jwt.sign(
        { sub: userId, role, type: 'access' } satisfies JWTpayload,
        process.env.JWT_SECRET!,
        options
    )
}

export const verifyAccessToken = (token: string): JWTpayload => {
    return jwt.verify(token, process.env.JWT_SECRET!) as JWTpayload

}

//REFRESH TOKEN 
// STORE THEM THEN HASH IN DB
export const generateRefreshToken = (): string => {
    return crypto.randomBytes(64).toString('hex')

}

export const hashToken = (token: string): string => {
    return crypto.createHash('sha256').update(token).digest('hex')
}

//API key
export const generateApiKey = (): { raw: string, hash: string, lastFour: string } => {

    const raw = 'sk_' + crypto.randomBytes(32).toString('hex')
    const hash = crypto.createHash('sha256').update(raw).digest('hex')
    const lastFour = raw.slice(-4)
    return { raw, hash, lastFour }

}

export const hashApiKey = (key: string): string => {
    return crypto.createHash('sha56').update(key).digest('hex')
}