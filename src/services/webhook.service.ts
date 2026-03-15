import stripe from '../config/stripe.js'
import sql from '../config/db.js'
import logger from '../utils/logger.js'

// verify stripe signature
export const verifyStripeSignature = (payload: Buffer, signature: string) => {
    try {
        return stripe.webhooks.constructEvent(
            payload,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        )
    } catch {
        throw new Error('Invalid webhook signature')
    }
}

//check idempotency
export const isEventProcessed = async (stripeEventId: string): Promise<boolean> => {
    try {
        const [existing] = await sql`
        SELECT id from webhook_events
        WHERE stripe_event_id =${stripeEventId}
        AND processed = true`
        return !!existing
    } catch {
        return false
    }

}

export const logEvent = async (stripeEventId: string, type: string): Promise<void> => {
    await sql`
    INSERT INTO webhook_events (stripe_event_id, type, processed)
    VALUES (${stripeEventId}, ${type}, false)
    ON CONFLICT (stripe_event_id) DO NOTHING
  `
}

export const markEventProcessed = async (stripeEventId: string): Promise<void> => {
    await sql`
    UPDATE webhook_events SET processed = true
    WHERE stripe_event_id = ${stripeEventId}`


}

// EVENT HANDLERS ---------

const handlePaymentSucceeded = async (paymentIntent: any) => {
    logger.info({ paymentIntentId: paymentIntent.id }, 'attempting to update transaction')

    const result = await sql`
    UPDATE transactions
    SET status = 'completed', updated_at = NOW()
    WHERE stripe_payment_id = ${paymentIntent.id}
  `

    logger.info({ rowCount: result.count }, 'update result')
}

const handlePaymentFailed = async (paymentIntent: any) => {
    await sql`
    UPDATE transactions
    SET status = 'failed', updated_at = NOW()
    WHERE stripe_payment_id = ${paymentIntent.id}
  `

    logger.warn({ paymentIntentId: paymentIntent.id }, 'payment failed')

}

const handleRefundUpdated = async (charge: any) => {


}

const handleCustomerDeleted = async (customer: any) => {

    await sql`DELETE FROM customers
    WHERE stripe_payment_id = ${customer.id}`

    logger.info({ customerId: customer.id }, 'customer deleted')

}

//Main event router
export const handleStripeEvent = async (event: any): Promise<void> => {
    logger.info({ eventType: event.type }, 'processing webhook event')

    switch (event.type) {
        case 'payment_intent.succeeded':
            await handlePaymentSucceeded(event.data.object)
            break
        case 'payment_intent.payment_failed':
            await handlePaymentFailed(event.data.object)
            break
        case 'charge.refunded':
            await handleRefundUpdated(event.data.object)
            break
        case 'customer.deleted':
            await handleCustomerDeleted(event.data.object)
            break
        default:
            logger.warn({ eventType: event.type }, 'unhandled webhook event')
    }
}