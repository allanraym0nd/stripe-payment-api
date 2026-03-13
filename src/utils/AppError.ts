export class AppError extends Error {
    statusCode: number
    isOperational: boolean

    constructor(message: string, statusCode: number) {
        super(message)
        this.statusCode = statusCode
        this.isOperational = true
        // isOperational = true means we threw this intentionally
        // false would mean an unexpected crash we didn't anticipate

        Error.captureStackTrace(this, this.constructor)
    }

}