import rateLimit, { ipKeyGenerator } from 'express-rate-limit'
import type { Request } from 'express'

const createLimiter = (windowMs: number, max: number, message: string) =>
    rateLimit({
        windowMs,
        max,
        message: { error: message },
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: (req) => ipKeyGenerator(req as any)
    })

export const authLimiter = createLimiter(
    15 * 60 * 1000,
    10,
    'Too many attempts, please try again in 15 minutes'
)

export const paymentLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    message: { error: 'Too many payment requests, slow down' },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return (req as any).user?.id ?? ipKeyGenerator(req as any)
    }
})

export const generalLimiter = createLimiter(
    60 * 1000,
    100,
    'Too many requests, please slow down'
)