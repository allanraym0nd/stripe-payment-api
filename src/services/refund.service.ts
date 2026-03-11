import stripe from '../config/stripe.js'
import sql from '../config/db.js'

export const createRefund = async (
    transactionId: string,
    userId: string,
    amount?: string,
    reason?: string
) => {
    const [transaction] = await sql`
    SELECT * FROM TRANSACTIONS
    WHERE id = ${transactionId}
    AND user_id = ${userId}
    `

    if (!transaction) throw new Error('Transaction not found')
    if (transaction.status !== 'completed') throw new Error('Only completed transactions can be refunded')

    // CHECK HOW MUCH HAS ALREADY BEEN REFUNDED
    const [{ total_refunded }] = await sql`
    SELECT COALESCE(SUM(AMOUNT), 0) AS total_refunded
    FROM refunds
    WHERE transaction_id = ${transactionId}`

    const alreadyrefunded = parseInt(total_refunded)
    const refundAmount = amount ?? transaction.amount

    if (alreadyrefunded + refundAmount > transaction.amount) {
        throw new Error('Refund amount exceeds original transaction amount')

    }
    const refund = await stripe.refunds.create({
        payment_intent: transaction.stripe_payment_id,
        amount: refundAmount,
        reason: (reason as any) ?? 'requested_by_customer'
    })

    const [savedRefund] = await sql`
    INSERT INTO refunds (transaction_id, stripe_refund_id, amount, reason, status)
    VALUES (${transactionId}, ${refund.id}, ${refundAmount}, ${reason ?? null}, ${refund.status})
    RETURNING *`

    if (alreadyrefunded + refundAmount === transaction.amount) {
        await sql`
        UPDATE transaction SET status = 'refunded', updated_at= NOW()
        WHERE id=${transactionId}`
    }
    return savedRefund

}

export const getRefund = async (refundId: string, userId: string) => {
    const [refund] = await sql`
    SELECT r.*, t.user_id
    FROM refunds r
    JOIN transactions t ON t.id = r.transaction.id
    WHERE r.id = ${refundId}
    AND t.user_id = ${userId}`

    if (!refund) throw new Error('Refund not found')
    return refund
}
