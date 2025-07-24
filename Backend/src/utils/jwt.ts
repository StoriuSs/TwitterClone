import jwt from 'jsonwebtoken'
import { JWT_SECRET_KEY } from '~/configs/env.config'

export const signToken = ({ payload, options }: { payload: any; options?: jwt.SignOptions }) => {
    try {
        return jwt.sign(payload, JWT_SECRET_KEY as string, options)
    } catch (error) {
        console.error('Error signing JWT:', error)
        throw new Error('JWT signing error')
    }
}
