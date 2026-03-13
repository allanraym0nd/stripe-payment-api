import type { Request, Response, NextFunction } from 'express'
import { AppError } from '../utils/AppError.js'
import logger from '../utils/logger.js'

export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const requestId = (req as any).requestId
    // Log every error with context
    // console.error({
    //     message: err.message,
    //     stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    //     path: req.path,
    //     method: req.method,
    //     timestamp: new Date().toISOString()

    // })

    if (err instanceof AppError) {
        logger.warn({
            requestId,
            statusCode: err.statusCode,
            message: err.message,
            path: req.path
        }, 'operational error')
        res.status(res.statusCode).json({ error: err.message })
        return
    }
    // stripe errors
    if (err.constructor.name === 'StripeError') {
        const stripeErr = err as any
        logger.warn({
            requestId,
            stripeCode: stripeErr.code,
            message: stripeErr.message
        }, 'stripe error')
        res.status(stripeErr.statusCode ?? 400).json({ error: stripeErr.message })
        return
    }

    if ((err as any).code) {
        const pgErr = err as any

        if (pgErr.code === '23505') {
            res.status(409).json({ error: 'Resource already exists' })
            return
        }

        // Foreign key violation
        if (pgErr.code === '23503') {
            res.status(400).json({ error: 'Referenced resource does not exist' })
            return
        }
    }

    logger.error({
        requestId,
        message: err.message,
        stack: err.stack,
        method: req.method,
        path: req.path,

    }, 'unhandled error')

    res.status(500).json({
        error: process.env.NODE_ENV === 'development'
            ? err.message
            : 'Something went wrong'

    })


}