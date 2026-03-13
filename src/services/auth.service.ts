import bcrypt from 'bcryptjs'
import sql from '../config/db.js'
import {
    signAccessToken,
    generateRefreshToken,
    hashToken,
    generateApiKey,
    hashApiKey
} from "../utils/tokens.js"
import type { AuthUser } from "../types/auth.types.js"
import { AppError } from '../utils/AppError.js'

const SALT_ROUNDS = 12


export const registerUser = async (email: string, password: string): Promise<AuthUser> => {
    const existing = await sql`SELECT id FROM users WHERE email = ${email}`
    if (existing.length > 0) throw new AppError('Email already in use', 409)

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS)
    const [user] = await sql`
    INSERT INTO users (email, password_hash)
    VALUES (${email}, ${password_hash})
    RETURNING id, email, role
  `
    return user as AuthUser
}

export const loginUser = async (email: string, password: string) => {
    const [user] = await sql`
    SELECT id, email, role, password_hash FROM users WHERE email = ${email}
  `
    if (!user) throw new AppError('Invalid credentials', 401)

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) throw new AppError('Invalid credentials', 401)

    const accessToken = signAccessToken(user.id, user.role)
    const refreshToken = generateRefreshToken()
    const tokenHash = hashToken(refreshToken)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    await sql`
    INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
    VALUES (${user.id}, ${tokenHash}, ${expiresAt})
  `

    return { accessToken, refreshToken, user: { id: user.id, email: user.email, role: user.role } }
}

export const refreshAccessToken = async (incomingToken: string) => {
    const tokenHash = hashToken(incomingToken)
    const [stored] = await sql`
    SELECT rt.id, rt.user_id, rt.expires_at, rt.revoked, u.role
    FROM refresh_tokens rt
    JOIN users u ON u.id = rt.user_id
    WHERE rt.token_hash = ${tokenHash}
  `

    if (!stored) throw new AppError('Invalid refresh token', 401)
    if (stored.revoked) throw new AppError('Refresh token revoked', 401)
    if (new Date(stored.expires_at) < new Date()) throw new AppError('Refresh token expired', 401)

    await sql`UPDATE refresh_tokens SET revoked = true WHERE id = ${stored.id}`

    const newRefreshToken = generateRefreshToken()
    const newHash = hashToken(newRefreshToken)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    await sql`
    INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
    VALUES (${stored.user_id}, ${newHash}, ${expiresAt})
  `

    return {
        accessToken: signAccessToken(stored.user_id, stored.role),
        refreshToken: newRefreshToken
    }
}

export const logoutUser = async (incomingToken: string): Promise<void> => {
    const tokenHash = hashToken(incomingToken)
    await sql`UPDATE refresh_tokens SET revoked = true WHERE token_hash = ${tokenHash}`

}

export const createApiKey = async (userId: string, name: string, scopes: string[]): Promise<{ raw: string, lastFour: string, id: string }> => {
    const { raw, hash, lastFour } = generateApiKey()

    const [key] = await sql`
    INSERT INTO api_keys (user_id, name, key_hash, last_four, scopes)
    VALUES (${userId}, ${name}, ${hash}, ${lastFour}, ${scopes}::text[])
    RETURNING id
    `

    // Return raw key — this is the only time it's ever returned
    return { raw, lastFour, id: key.id }

}

export const revokeApiKey = async (keyId: string, userId: string): Promise<void> => {
    await sql`UPDATE api_keys SET is_active = false
    WHERE id = ${keyId} and user_id = ${userId} `
}

export const listApiKeys = async (userId: string) => {
    await sql`
    SELECT id, name, last_four, scopes, is_active, last_used_at, created_at
    FROM api_keys
    WHERE user_id = ${userId}
    `

}


// instead of throw new error , just use the AppError