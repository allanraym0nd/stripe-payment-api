import stripe from '../config/stripe.js'
import sql from '../config/db.js'
import { AppError } from '../utils/AppError.js'

export const createRefund = async (
    transactionId: string,
    userId: string,
    amount?: number,
    reason?: string
) => {
    const [transaction] = await sql`
    SELECT * FROM transactions WHERE id = ${transactionId} AND user_id = ${userId}
  `
    if (!transaction) throw new AppError('Transaction not found', 404)
    if (transaction.status !== 'completed') throw new AppError('Only completed transactions can be refunded', 400)

    const [{ total_refunded }] = await sql`
    SELECT COALESCE(SUM(amount), 0) AS total_refunded
    FROM refunds WHERE transaction_id = ${transactionId}
  `

    const alreadyRefunded = parseInt(total_refunded)
    const refundAmount = amount ?? transaction.amount

    if (alreadyRefunded + refundAmount > transaction.amount) {
        throw new AppError('Refund amount exceeds original transaction amount', 400)
    }

    const refund = await stripe.refunds.create({
        payment_intent: transaction.stripe_payment_id,
        amount: refundAmount,
        reason: (reason as any) ?? 'requested_by_customer',
    }, {
        idempotencyKey: `rf_${transactionId}_${refundAmount}_${Date.now()}`
    })

    const [savedRefund] = await sql`
    INSERT INTO refunds (transaction_id, stripe_refund_id, amount, reason, status)
    VALUES (${transactionId}, ${refund.id}, ${refundAmount}, ${reason ?? null}, ${refund.status})
    RETURNING *
  `

    if (alreadyRefunded + refundAmount === transaction.amount) {
        await sql`UPDATE transactions SET status = 'refunded', updated_at = NOW() WHERE id = ${transactionId}`
    }

    return savedRefund
}

export const getRefund = async (refundId: string, userId: string) => {
    const [refund] = await sql`
    SELECT r.*, t.user_id FROM refunds r
    JOIN transactions t ON t.id = r.transaction_id
    WHERE r.id = ${refundId} AND t.user_id = ${userId}
  `
    if (!refund) throw new AppError('Refund not found', 404)
    return refund
}