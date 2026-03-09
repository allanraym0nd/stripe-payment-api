export interface JWTpayload {
    sub: string,
    role: string,
    type: 'access' | 'refresh'
}

export interface AuthUser {
    id: string,
    email: string,
    role: string
}
