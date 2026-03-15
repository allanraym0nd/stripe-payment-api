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

/**
 * @swagger
 * /payments/intent:
 *   post:
 *     summary: Create a new payment intent
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount]
 *             properties:
 *               amount:
 *                 type: integer
 *                 minimum: 50
 *                 description: Amount in cents
 *               currency:
 *                 type: string
 *                 default: usd
 *               metadata:
 *                 type: object
 *                 additionalProperties:
 *                   type: string
 *     responses:
 *       201:
 *         description: Payment intent created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 intent:
 *                   type: object
 *                 transaction:
 *                   $ref: '#/components/schemas/Transaction'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/intent', paymentLimiter, validate(createIntentSchema), createIntent)

/**
 * @swagger
 * /payments/intent/{id}/confirm:
 *   post:
 *     summary: Confirm a payment intent
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Stripe payment intent ID
 *     responses:
 *       200:
 *         description: Payment intent confirmed
 *       400:
 *         description: Confirmation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/intent/:id/confirm', paymentLimiter, confirmIntent)

/**
 * @swagger
 * /payments/intent/{id}:
 *   get:
 *     summary: Retrieve a payment intent
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Stripe payment intent ID
 *     responses:
 *       200:
 *         description: Payment intent details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 intent:
 *                   type: object
 *                 transaction:
 *                   $ref: '#/components/schemas/Transaction'
 *       404:
 *         description: Transaction not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/intent/:id', generalLimiter, getIntent)

/**
 * @swagger
 * /payments/intent/{id}/cancel:
 *   post:
 *     summary: Cancel a pending payment intent
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment intent cancelled
 *       400:
 *         description: Cannot cancel — not in pending state
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/intent/:id/cancel', paymentLimiter, cancelIntent)

/**
 * @swagger
 * /payments/transactions:
 *   get:
 *     summary: List all transactions for the authenticated user
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, completed, failed, cancelled, refunded]
 *     responses:
 *       200:
 *         description: List of transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 transactions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Transaction'
 *                 total:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 offset:
 *                   type: integer
 */
router.get('/transactions', generalLimiter, getTransactions)

/**
 * @swagger
 * /payments/refunds:
 *   post:
 *     summary: Create a refund for a completed transaction
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [transactionId]
 *             properties:
 *               transactionId:
 *                 type: string
 *                 format: uuid
 *               amount:
 *                 type: integer
 *                 description: Partial refund amount in cents. Omit for full refund.
 *               reason:
 *                 type: string
 *                 enum: [duplicate, fraudulent, requested_by_customer]
 *     responses:
 *       201:
 *         description: Refund created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Refund'
 *       400:
 *         description: Refund failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/refunds', paymentLimiter, validate(refundSchema), refund)

/**
 * @swagger
 * /payments/refunds/{id}:
 *   get:
 *     summary: Get a refund by ID
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Refund details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Refund'
 *       404:
 *         description: Refund not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/refunds/:id', generalLimiter, getRefundById)

export default router