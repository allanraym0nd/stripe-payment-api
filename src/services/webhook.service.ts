import stripe from '../config/stripe.js'
import sql from '../config/db.js'

// verify stripe signature
export const verifyStripeSignature = async (payload: Buffer, signature: string) => {
    try {
        return stripe.webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET!)

    } catch {
        throw new Error('Invalid Webhook signature')

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
    ON CONFLICT(stripe_event_id)`
}

export const markEventProcessed = async (stripeEventId: string): Promise<void> => {
    await sql`
    UPDATE webhook_events SET processed = true
    WHERE stripe_event_id = ${stripeEventId}`


}

// EVENT HANDLERS ---------

const handlePaymentSucceeded = async (paymentIntent: any) => {

    await sql`
    UPDATE transactions 
    SET status = "completed", updated_at = NOW()
    WHERE stripe_payment_id = ${paymentIntent.id} `

    console.log(`Payment Succeeded: ${paymentIntent.id}`)

}

const handlePaymentFailed = async (paymentIntent: any) => {
    await sql`
    UPDATE transactions
    SET status = 'failed', updated_at = NOW()
    WHERE stripe_payment_id = ${paymentIntent.id}
  `
    console.log(`✘ Payment failed: ${paymentIntent.id}`)

}

const handleRefundUpdated = async (charge: any) => {


}

const handleCustomerDeleted = async (customer: any) => {

    await sql`DELETE FROM customers
    WHERE stripe_payment_id = ${customer.id}`

    console.log(`Customer deleted: ${customer.id}`)

}

//Main event router
export const handleStripeEvent = async (event: any): Promise<void> => {
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
            console.log(`Unhandled event type: ${event.type}`)

    }

}