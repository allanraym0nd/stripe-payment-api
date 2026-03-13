import z from "zod";

export const registerSchema = z.object({
    email: z
        .string()
        .email('Invalid email format')
        .toLowerCase(),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character')
})

export const loginSchema = z.object({
    email: z.string().email('Invalid email format').toLowerCase(),
    password: z.string().min(1, 'Password is required')
})

export const apiKeySchema = z.object({
    name: z
        .string()
        .min(1, 'Name is required')
        .max(50, 'Name must be under 50 characters'),
    scopes: z
        .array(z.enum(['read', 'write', 'refund']))
        .min(1, 'At least one scope is required')
        .default(['read'])

})

