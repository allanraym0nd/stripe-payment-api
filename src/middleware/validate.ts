import { z, type ZodIssue } from 'zod'
import type { Request, Response, NextFunction } from 'express'

export const validate = (schema: z.ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.body) {
            res.status(400).json({ error: 'Request body is required' })
            return
        }

        const result = schema.safeParse(req.body)

        if (!result.success) {
            const errors = result.error.issues.map((issue: ZodIssue) => ({
                field: issue.path.join('.'),
                message: issue.message
            }))
            res.status(400).json({ errors })
            return
        }

        req.body = result.data
        next()
    }
}