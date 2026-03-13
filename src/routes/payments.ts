import { Router } from 'express'
import {
    createIntent,
    confirmIntent,
    getIntent,
    cancelIntent,
    getTransactions,
    refund,
    getRefundById
} from '../controllers/payment.controller.js'
import { requireAuth } from '../middleware/auth.js'
import { paymentLimiter, generalLimiter } from '../middleware/rateLimiter.js'
import { validate } from '../middleware/validate.js'
import { createIntentSchema, refundSchema } from '../validators/payment.schemas.js'

const router = Router()

router.use(requireAuth)

// Mutating endpoints get payment limiter
router.post('/intent', paymentLimiter, validate(createIntentSchema), createIntent)
router.post('/intent/:id/confirm', paymentLimiter, confirmIntent)
router.post('/intent/:id/cancel', paymentLimiter, cancelIntent)
router.post('/refunds', paymentLimiter, validate(refundSchema), refund)

// Read endpoints get general limiter
router.get('/intent/:id', generalLimiter, getIntent)
router.get('/transactions', generalLimiter, getTransactions)
router.get('/refunds/:id', generalLimiter, getRefundById)

export default router