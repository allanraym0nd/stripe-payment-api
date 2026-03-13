import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.js'
import paymentRoutes from './routes/payments.js'
import webhookRoutes from './routes/webhooks.js'
import { generalLimiter } from './middleware/rateLimiter.js'
import { errorHandler } from './middleware/errorHandler.js'
import { requestLogger } from './middleware/requestLogger.js'
import logger from './utils/logger.js'

dotenv.config()
const app = express()

app.use(requestLogger)
//SECURITY
app.use(helmet())
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }))
app.use(cookieParser())

//for webhooks
app.use('/webhooks/stripe', express.raw({ type: 'application/json' }))
app.get('/ping', (req, res) => res.json({ message: 'pong' }))

app.use(express.json())
app.use(generalLimiter)
app.use('/auth', authRoutes)
app.use('/payments', paymentRoutes)
app.use('/webhooks', webhookRoutes)


app.use(errorHandler)


app.listen(process.env.PORT, () => { logger.info({ port: process.env.PORT }, 'server started') })

export default app;