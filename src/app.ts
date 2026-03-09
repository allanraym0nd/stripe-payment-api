import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'

const app = express()

//SECURITY
app.use(helmet())
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }))
app.use(cookieParser())

//for webhooks
app.use('/webhooks/stripe', express.raw({ type: 'application/json' }))

app.use(express.json())

app.listen(process.env.PORT, () => { console.log(`Server running on port ${process.env.PORT}`) })

export default app;