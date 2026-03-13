import z from "zod";

export const createIntentSchema = z.object({
    amount: z
        .number()
        .int('Amount should be a whole number')
        .min(50, 'Amount must be at least 50 cents'),
    currency: z
        .string()
        .length(3, 'Currency must be a 3 letter code')
        .toLowerCase()
        .default('usd'),
    metadata: z
        .record(z.string(), z.string())
        .optional()
})

export const refundSchema = z.object({
    transactionId: z.string().uuid('Invalid transaction ID'),
    amount: z
        .number()
        .int('Amount must be a whole number')
        .min(1, 'Refund amount must be at least 1 cent')
        .optional(),
    reason: z
        .enum(['duplicate', 'fraudulent', 'requested_by_customer'])
        .optional()
        .default('requested_by_customer')
})