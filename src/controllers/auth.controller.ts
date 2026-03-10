import type { Request, Response } from 'express'
import {
    registerUser,
    loginUser,
    refreshAccessToken,
    logoutUser,
    createApiKey,
    revokeApiKey,
    listApiKeys
} from '../services/auth.service.js'

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000

}

export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body
        if (!email || !password) {
            res.status(400).json({ error: 'Email and password required' })
            return
        }
        if (password.length < 8) {
            res.status(400).json({ error: 'Password must be at least 8 characters' })
            return
        }

        const user = await registerUser(email, password)
        res.status(201).json({ user })

    } catch (err: any) {
        res.status(400).json({ error: err.message })

    }

}

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body
        if (!email || !password) {
            res.status(400).json({ error: 'Email and password required' })
            return
        }
        const { accessToken, refreshToken, user } = await loginUser(email, password)


        res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS)
        res.json({ accessToken, user })

    } catch (err: any) {
        res.status(401).json({ error: err.message })

    }


}

export const refresh = async (req: Request, res: Response): Promise<void> => {
    try {
        const token = req.cookies?.refreshToken
        if (!token) {
            res.status(401).json({ error: 'No refresh token' })
            return
        }

        const { accessToken, refreshToken } = await refreshAccessToken(token)
        res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS)
        res.json({ accessToken })

    } catch (err: any) {
        res.status(401).json({ error: err.message })

    }

}

export const logout = async (req: Request, res: Response): Promise<void> => {
    try {
        const token = req.cookies?.refreshToken
        if (token) await logoutUser(token)
        res.clearCookie(token)
        res.json({ message: "Logged out" })


    } catch (err: any) {
        res.status(500).json({ error: 'Logout failed' })
    }


}

export const generateApiKey = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, scopes } = req.body
        if (!name) {
            res.status(400).json({ error: 'Key name required' })
            return
        }

        const validScopes = ["read", "write", "refund"]
        const requestedScopes: string[] = scopes || ["read"]
        const invalidScopes = requestedScopes.filter((s: string) => !validScopes.includes(s))

        if (invalidScopes.length > 0) {
            res.status(400).json({ error: `Invalid scopes: ${invalidScopes.join(', ')}` })
            return

        }

        const key = await createApiKey(req.user!.id, name, requestedScopes)

        res.json({
            id: key.id,
            key: key.raw,
            lastFour: key.lastFour,
            message: 'Store this key securely. It will not be shown again.'

        })


    } catch (err: any) {
        res.status(400).json({ error: err.message })

    }


}

export const getApiKeys = async (req: Request, res: Response): Promise<void> => {
    try {
        const keys = listApiKeys(req.user!.id)
        res.json({ keys })

    } catch {
        res.status(500).json({ error: 'Failed to fetch keys' })
    }

}

export const deleteApiKey = async (req: Request, res: Response): Promise<void> => {
    try {

        await revokeApiKey(req.params.id as string, req.user!.id)
        res.json({ message: 'Key revoked' })
    } catch {
        res.status(500).json({ error: 'Failed to revoke key' })
    }
}