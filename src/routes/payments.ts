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

const router = Router()

// All payment routes require auth
router.use(requireAuth)

router.post('/intent', createIntent)
router.post('/intent/:id/confirm', confirmIntent)
router.get('/intent/:id', getIntent)
router.post('/intent/:id/cancel', cancelIntent)
router.get('/transactions', getTransactions)
router.post('/refunds', refund)
router.get('/refunds/:id', getRefundById)

export default router