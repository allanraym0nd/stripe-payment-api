import type { Request, Response, NextFunction } from 'express'
import {
    createPaymentIntent,
    confirmPaymentIntent,
    getPaymentIntent,
    cancelPaymentIntent,
    listTransactions
} from '../services/payment.service.js'
import { createRefund, getRefund } from '../services/refund.service.js'

export const createIntent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { amount, currency, metadata } = req.body
        const result = await createPaymentIntent(req.user!.id, amount, currency, metadata)
        res.status(201).json(result)
    } catch (err: any) {
        next(err)
    }
}

export const confirmIntent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const intent = await confirmPaymentIntent(req.params.id! as string)
        res.json({ intent })

    } catch (err: any) {
        next(err)
    }

}

export const getIntent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const result = await getPaymentIntent(req.params.id as string, req.user!.id)
        res.json(result)
    } catch (err: any) {
        next(err)
    }
}

export const cancelIntent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const intent = await cancelPaymentIntent(req.params.id as string, req.user!.id)
        res.json(intent)
    } catch (err: any) {
        next(err)
    }
}


export const getTransactions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const limit = parseInt(req.query.limit as string) || 10
        const offset = parseInt(req.query.offset as string) || 0
        const status = req.query.status

        const result = await listTransactions(req.user!.id, limit, offset, status as string)
        res.json(result)

    } catch (err: any) {
        next(err)
    }
}

export const refund = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { transactionId, amount, reason } = req.body
        const result = await createRefund(transactionId, req.user!.id, amount, reason)
        res.status(201).json(result)
    } catch (err: any) {
        next(err)
    }
}

export const getRefundById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await getRefund(req.params.id as string, req.user!.id as string)
        res.json(result)

    } catch (err: any) {
        next(err)
    }
}