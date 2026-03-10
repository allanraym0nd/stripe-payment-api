import type { Request, Response, NextFunction } from 'express'
import { verifyAccessToken } from '../utils/tokens.js'
import { hashApiKey } from '../utils/tokens.js'
import sql from '../config/db.js'

// Extend Express Request 
declare global {
    namespace Express {
        interface Request {
            user?: { id: string; role: string }
        }
    }
}

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
    try {
        const header = req.headers.authorization
        if (!header?.startsWith('Bearer ')) {
            res.status(401).json({ error: 'Missing token' })
            return
        }

        const token = header.split(' ')[1]
        const payload = verifyAccessToken(token)

        if (payload.type !== 'access') {
            res.status(401).json('Invalid token type')
            return
        }

        req.user = { id: payload.sub, role: payload.role }
        next()
    } catch {
        res.status(401).json({ error: 'Invalid or expired token' })
    }
}


export const requireApiKey = (requiredScope: string) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const header = req.headers.authorization
            if (!header?.startsWith('Bearer ')) {
                res.status(401).json({ error: 'Missing API key' })
                return
            }

            const incoming = header.split(' ')[1]
            const keyHash = hashApiKey(incoming)

            const [key] = await sql`
            SELECT id, user_id, scopes, is_active
            FROM api_keys
            WHERE key_hash = ${keyHash}
            `

            if (!key || !key.is_active) {
                res.status(401).json({ error: 'Invalid API key' })
                return
            }

            if (!key.includes(requiredScope)) {
                res.status(403).json({ error: 'Insufficient Scope' })
                return

            }
            await sql`UPDATE api_keys SET last_used_at = NOW() where id = ${key.id}`
            req.user = { id: key.user_id, role: 'api' }
            next()
        } catch {
            res.status(401).json({ error: 'Invalid API key' })
        }
    }

}

export const requireRole = (role: string) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (req.user?.role !== 'role') {
            res.status(403).json({ error: 'Forbidden' })
            return
        }

        next()
    }
}