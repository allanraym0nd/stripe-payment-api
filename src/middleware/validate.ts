import type { Request, Response, NextFunction } from 'express'
import { safeParse, z } from 'zod'

export const validate = (schema: z.ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.body)

        if (!result.success) {
            const errors = result.error.issues.map((issue: z.ZodIssue) => ({
                field: issue.path.join('.'),
                message: issue.message
            }))

            res.status(400).json({ errors })
        }

        req.body = result.data
        next()

    }

}