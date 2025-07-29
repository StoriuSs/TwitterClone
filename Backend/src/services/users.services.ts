import databaseService from '~/services/database.services'
import User from '~/models/schemas/User.schema'
import { RegisterReqBody } from '~/models/requests/User.requests'
import { hashPassword } from '~/utils/hash'
import { signToken } from '~/utils/jwt'
import { TokenType, UserVerifyStatus } from '~/constants/enum'
import {
    JWT_ACCESS_TOKEN_EXPIRATION,
    JWT_ACCESS_TOKEN_SECRET_KEY,
    JWT_REFRESH_TOKEN_SECRET_KEY,
    JWT_REFRESH_TOKEN_EXPIRATION
} from '~/configs/env.config'
import { ObjectId } from 'mongodb'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import { userMessages } from '~/constants/messages'
import crypto from 'crypto'
class UsersService {
    private signAccessToken(user_id: string) {
        return signToken({
            payload: {
                user_id,
                token_type: TokenType.AccessToken
            },
            JWT_SECRET_KEY: JWT_ACCESS_TOKEN_SECRET_KEY as string,
            options: {
                expiresIn: JWT_ACCESS_TOKEN_EXPIRATION as any
            }
        })
    }

    private signRefreshToken(user_id: string) {
        return signToken({
            payload: {
                user_id,
                token_type: TokenType.RefreshToken
            },
            JWT_SECRET_KEY: JWT_REFRESH_TOKEN_SECRET_KEY as string,
            options: {
                expiresIn: JWT_REFRESH_TOKEN_EXPIRATION as any
            }
        })
    }

    private signBothTokens(user_id: string) {
        return Promise.all([this.signAccessToken(user_id), this.signRefreshToken(user_id)])
    }

    async emailExists(email: string) {
        const user = await databaseService.users.findOne({ email })
        return !!user
    }

    async register(payload: RegisterReqBody) {
        const email_verify_token = crypto.randomBytes(32).toString('hex')
        const hashedPassword = await hashPassword(payload.password)
        const result = await databaseService.users.insertOne(
            new User({
                ...payload, // Spread the payload to match User schema
                password: hashedPassword,
                date_of_birth: new Date(payload.date_of_birth), // Convert date_of_birth to Date object
                email_verify_token
            })
        )
        const user_id = result.insertedId.toString()
        const [access_token, refresh_token] = await this.signBothTokens(user_id)
        // Store the refresh token in the database
        await databaseService.refreshTokens.insertOne(
            new RefreshToken({
                token: refresh_token,
                user_id: new ObjectId(user_id)
            })
        )
        return {
            access_token,
            refresh_token,
            email_verify_token
        }
    }

    async login(user_id: string) {
        const [access_token, refresh_token] = await this.signBothTokens(user_id)
        // Store the refresh token in the database
        await databaseService.refreshTokens.insertOne(
            new RefreshToken({
                token: refresh_token,
                user_id: new ObjectId(user_id)
            })
        )
        return {
            access_token,
            refresh_token
        }
    }

    async logout(refresh_token: string) {
        await databaseService.refreshTokens.deleteOne({
            token: refresh_token
        })
        return {
            message: userMessages.userLoggedOut
        }
    }

    async verifyEmail(user_id: string) {
        await databaseService.users.updateOne(
            { _id: new ObjectId(user_id) },
            {
                $set: {
                    email_verify_token: '',
                    verify: UserVerifyStatus.Verified
                },
                $currentDate: { updated_at: true }
            }
        )
        const [access_token, refresh_token] = await this.signBothTokens(user_id)
        return {
            access_token,
            refresh_token
        }
    }

    async resendVerifyEmail(user_id: string) {
        const email_verify_token = crypto.randomBytes(32).toString('hex')
        await databaseService.users.updateOne(
            { _id: new ObjectId(user_id) },
            {
                $set: {
                    email_verify_token
                },
                $currentDate: { updated_at: true }
            }
        )
        // Here we would typically send the email with the token
        // For now, we just return the message for testing purposes
        return {
            message: userMessages.emailVerifyEmailResent,
            email_verify_token
        }
    }
}

const usersService = new UsersService()
export default usersService
