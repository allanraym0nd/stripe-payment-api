import type { Request, Response, NextFunction } from 'express'
import logger from '../utils/logger.js'
import crypto from 'crypto'

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
    const requestId = crypto.randomBytes(8).toString('hex')
    const start = Date.now() as number

    (req as any).requestId = requestId


    logger.info({
        requestId,
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.headers['user-agent']
    }, 'incoming request')

    res.on('finish', () => {
        const duration = Date.now() - start
        const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info'

        logger[level]({
            requestId,
            method: req.method,
            path: req.path,
            statusCode: req.statusCode,
            duration: `${duration}ms`,
            userId: (req as any).user?.id

        }, 'request completed')
    })
    next()

}