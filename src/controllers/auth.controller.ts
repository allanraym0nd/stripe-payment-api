import type { NextFunction, Request, Response } from 'express'
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

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { email, password } = req.body
        const user = await registerUser(email, password)
        res.status(201).json({ user })
    } catch (err: any) {
        next(err)
    }
}

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { email, password } = req.body
        const { accessToken, refreshToken, user } = await loginUser(email, password)
        res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS)
        res.json({ accessToken, user })
    } catch (err: any) {
        next(err)
    }
}

export const refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
        next(err)

    }

}

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const token = req.cookies?.refreshToken
        if (token) await logoutUser(token)
        res.clearCookie(token)
        res.json({ message: "Logged out" })


    } catch (err: any) {
        next(err)
    }


}

export const generateApiKey = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { name, scopes } = req.body
        const key = await createApiKey(req.user!.id, name, scopes)
        res.status(201).json({
            id: key.id,
            key: key.raw,
            lastFour: key.lastFour,
            message: 'Store this key securely. It will not be shown again.'
        })
    } catch (err: any) {
        next(err)
    }
}

export const getApiKeys = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const keys = listApiKeys(req.user!.id)
        res.json({ keys })

    } catch (err) {
        next(err)
    }

}

export const deleteApiKey = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {

        await revokeApiKey(req.params.id as string, req.user!.id)
        res.json({ message: 'Key revoked' })
    } catch (err: any) {
        next(err)
    }
}