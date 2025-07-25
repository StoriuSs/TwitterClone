import databaseService from '~/services/database.services'
import User from '~/models/schemas/User.schema'
import { RegisterReqBody } from '~/models/requests/User.requests'
import { hashPassword } from '~/utils/hash'
import { signToken } from '~/utils/jwt'
import { TokenType } from '~/constants/enum'
import { JWT_ACCESS_TOKEN_EXPIRATION, JWT_REFRESH_TOKEN_EXPIRATION } from '~/configs/env.config'
import { ObjectId } from 'mongodb'
import RefreshToken from '~/models/schemas/RefreshToken.schema'

class UsersService {
    private signAccessToken(user_id: string) {
        return signToken({
            payload: {
                user_id,
                token_type: TokenType.AccessToken
            },
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
        const hashedPassword = await hashPassword(payload.password)
        const result = await databaseService.users.insertOne(
            new User({
                ...payload, // Spread the payload to match User schema
                password: hashedPassword,
                date_of_birth: new Date(payload.date_of_birth) // Convert date_of_birth to Date object
            })
        )
        const user_id = result.insertedId.toString()
        const [accessToken, refreshToken] = await this.signBothTokens(user_id)
        // Store the refresh token in the database
        await databaseService.refreshTokens.insertOne(
            new RefreshToken({
                token: refreshToken,
                user_id: new ObjectId(user_id)
            })
        )
        return {
            accessToken,
            refreshToken
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
}

const usersService = new UsersService()
export default usersService
