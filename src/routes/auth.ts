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

const router = Router()

router.post('/register', register)
router.post('/login', login)
router.post('/refresh', refresh)
router.post('/logout', logout)

router.post('/api-keys', requireAuth, generateApiKey)
router.get('/api-keys', requireAuth, getApiKeys)
router.delete('/api-keys/:id', requireAuth, deleteApiKey)

export default router