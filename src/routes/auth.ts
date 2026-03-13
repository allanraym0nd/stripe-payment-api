import { Router } from 'express'
import {
    register,
    login,
    refresh,
    logout,
    generateApiKey,
    getApiKeys,
    deleteApiKey
} from '../controllers/auth.controller.js'
import { requireAuth } from '../middleware/auth.js'
import { authLimiter } from '../middleware/rateLimiter.js'
import { validate } from '../middleware/validate.js'
import { registerSchema, loginSchema, apiKeySchema } from '../validators/auth.schemas.js'

const router = Router()


router.post('/register', authLimiter, validate(registerSchema), register)
router.post('/login', authLimiter, validate(loginSchema), login)
router.post('/refresh', authLimiter, refresh)
router.post('/logout', logout)

router.post('/api-keys', requireAuth, validate(apiKeySchema), generateApiKey)
router.get('/api-keys', requireAuth, getApiKeys)
router.delete('/api-keys/:id', requireAuth, deleteApiKey)

export default router