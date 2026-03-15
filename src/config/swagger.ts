import swaggerJsdoc from 'swagger-jsdoc'

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Stripe Payment API',
            version: '1.0.0',
            description: 'A secure payment processing API built with Stripe',
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Development server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            },
            schemas: {
                Error: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' }
                    }
                },
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        email: { type: 'string', format: 'email' },
                        role: { type: 'string', enum: ['customer', 'admin'] }
                    }
                },
                Transaction: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        stripe_payment_id: { type: 'string' },
                        amount: { type: 'integer', description: 'Amount in cents' },
                        currency: { type: 'string' },
                        status: {
                            type: 'string',
                            enum: ['pending', 'completed', 'failed', 'cancelled', 'refunded']
                        },
                        created_at: { type: 'string', format: 'date-time' }
                    }
                },
                Refund: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        transaction_id: { type: 'string', format: 'uuid' },
                        stripe_refund_id: { type: 'string' },
                        amount: { type: 'integer' },
                        reason: { type: 'string' },
                        status: { type: 'string' },
                        created_at: { type: 'string', format: 'date-time' }
                    }
                }
            }
        }
    },
    apis: ['./src/routes/*.ts']
}

export const swaggerSpec = swaggerJsdoc(options)
