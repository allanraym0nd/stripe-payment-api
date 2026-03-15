import type { Request, Response } from 'express'
import {
    verifyStripeSignature,
    isEventProcessed,
    logEvent,
    markEventProcessed,
    handleStripeEvent
} from '../services/webhook.service.js'
import logger from '../utils/logger.js'

export const stripeWebhook = async (req: Request, res: Response): Promise<void> => {
    const signature = req.headers['stripe-signature'] as string

    if (!signature) {
        res.status(400).json({ error: 'Missing stripe signature' })
        return
    }

    let event
    try {
        event = verifyStripeSignature(req.body, signature)
    } catch {
        res.status(400).json({ error: 'Invalid webhook signature' })
        return
    }

    // Respond to Stripe immediately
    res.status(200).json({ received: true })

    // Everything after this is fire-and-forget
    // must never reach Express error handler — response already sent
    try {
        const alreadyProcessed = await isEventProcessed(event.id)
        if (alreadyProcessed) {
            logger.info({ eventId: event.id }, 'skipping duplicate webhook event')
            return
        }

        await logEvent(event.id, event.type)
        await handleStripeEvent(event)
        await markEventProcessed(event.id)
    } catch (err) {
        logger.error({ eventId: event.id, err }, 'failed to process webhook event')
        // no next(err) here — response already sent
    }
}