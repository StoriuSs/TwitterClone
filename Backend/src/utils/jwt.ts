import jwt from 'jsonwebtoken'
import { JWT_SECRET_KEY } from '~/configs/env.config'
import httpStatus from '~/constants/httpStatus'
import { ErrorsWithStatus } from '~/models/Errors'
import { TokenPayload } from '~/models/requests/User.requests'

export const signToken = ({ payload, options }: { payload: any; options?: jwt.SignOptions }) => {
    try {
        return jwt.sign(payload, JWT_SECRET_KEY as string, options)
    } catch (error) {
        console.error('Error signing JWT:', error)
        throw new Error('JWT signing error')
    }
}

export const verifyToken = (token: string): TokenPayload => {
    try {
        return jwt.verify(token, JWT_SECRET_KEY as string) as TokenPayload
    } catch (error: any) {
        throw new ErrorsWithStatus(error.message, httpStatus.UNAUTHORIZED)
    }
}
