import type { Request, Response, NextFunction } from "express";
import {
    verifyStripeSignature,
    isEventProcessed,
    logEvent,
    markEventProcessed,
    handleStripeEvent
} from '../services/webhook.service.js'
import logger from "../utils/logger.js";

export const stripeWebhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const signature = req.headers['stripe-signature'] as string

    if (!signature) {
        res.status(400).json({ error: 'Missing stripe signature' })
        return
    }

    // verify the event came from stripe
    let event
    try {
        event = verifyStripeSignature(req.body, signature)
    } catch {
        res.status(400).json({ error: 'Invalid webhook signature' })
        return

    }

    res.status(200).json({ received: true }) // sent to stripe

    // idempotency check
    const alreadyProcessed = await isEventProcessed((await event).id)
    if (alreadyProcessed) {
        logger.info({ eventId: (await event).id }, 'skipping duplicate webhook event')
    }
    await logEvent((await event).id, (await event).type)

    try {
        await handleStripeEvent(event)
        await markEventProcessed((await event).id)

    } catch (err) {
        console.error(`Failed to process event ${(await event).id}:`, err)
        logger.warn({ eventId: (await event).id, err }, 'failed to process webhook event')

    }



}


