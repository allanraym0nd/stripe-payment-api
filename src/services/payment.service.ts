import stripe from "../config/stripe";
import sql from "../config/db";
import { AppError } from '../utils/AppError.js'
// create payment intent
export const createPaymentIntent = async (
    userId: string,
    amount: number,
    currency: string,
    metadata?: Record<string, string>) => {
    const customer = await getOrCreateCustomer(userId)

    const intent = await stripe.paymentIntents.create({
        amount,
        currency,
        customer: customer.stripe_customer_id,
        metadata: { userId, ...metadata },
        automatic_payment_methods: {
            enabled: true,
            allow_redirects: 'never'
        },
    }, {
        idempotencyKey: `pi_${userId}_${amount}_${Date.now()}`
    })

    const [transaction] = await sql`
    INSERT INTO transactions (user_id, stripe_payment_id, amount, currency, status, metadata)
    VALUES (${userId}, ${intent.id}, ${amount}, ${currency}, 'pending', ${JSON.stringify(metadata ?? {})})
    RETURNING *
    `

    return { intent, transaction }


}

// confirm payment
export const confirmPaymentIntent = async (paymentIntentId: string) => {
    const intent = await stripe.paymentIntents.confirm(paymentIntentId)

    await sql`
    UPDATE transactions
    SET status = ${intent.status === "succeeded" ? 'completed' : 'failed'},
    UPDATED_AT NOW()
    WHERE stripe_payment_id = ${paymentIntentId}
    `

    return intent
}


export const getPaymentIntent = async (paymentIntentId: string, userId: string) => {
    const [transaction] = await sql`
    SELECT * FROM transactions
    WHERE stripe_payment_id = ${paymentIntentId} AND user_id = ${userId}
  `
    if (!transaction) throw new AppError('Transaction not found', 404)

    const intent = await stripe.paymentIntents.retrieve(paymentIntentId)
    return { intent, transaction }
}


export const cancelPaymentIntent = async (paymentIntentId: string, userId: string) => {
    const [transaction] = await sql`
    SELECT * FROM transactions
    WHERE stripe_payment_id = ${paymentIntentId} AND user_id = ${userId}
  `
    if (!transaction) throw new AppError('Transaction not found', 404)
    if (transaction.status !== 'pending') throw new AppError('Only pending payments can be cancelled', 400)

    const intent = await stripe.paymentIntents.cancel(paymentIntentId)
    await sql`
    UPDATE transactions SET status = 'cancelled', updated_at = NOW()
    WHERE stripe_payment_id = ${paymentIntentId}
  `
    return intent
}

export const listTransactions = async (
    userId: string,
    limit: number = 10,
    offset: number = 0,
    status: string
) => {

    const transactions = status
        ? await sql`
    SELECT * FROM transactions
    WHERE user_id = ${userId}  AND status =${status}
    ORDER_BY created_at DESC
    LIMIT ${limit} OFFSET ${offset}
    `
        : await sql`
        SELECT * FROM transactions
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
        `

    const [{ count }] = await sql`
        SELECT COUNT(*) FROM transactions WHERE user_id = ${userId}
        `
    return { transactions, total: parseInt(count), limit, offset }

}

const getOrCreateCustomer = async (userId: string) => {
    const [existing] = await sql`
    SELECT * FROM CUSTOMERS WHERE user_id = ${userId}`
    if (existing) return existing

    const [user] = await sql`SELECT email FROM users WHERE id = ${userId}`

    const stripeCustomer = await stripe.customers.create({
        email: user.email,
        metadata: { userId }
    })

    const [customer] = await sql`
    INSERT INTO customers (user_id, stripe_customer_id)
    VALUES (${userId}, ${stripeCustomer.id})
    RETURNING *`

    return customer
}

