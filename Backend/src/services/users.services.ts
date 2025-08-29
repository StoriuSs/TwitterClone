import databaseService from '~/services/database.services'
import User from '~/models/schemas/User.schema'
import { RegisterReqBody, UpdateAboutMeReqBody } from '~/models/requests/User.requests'
import { hashPassword } from '~/utils/hash'
import { decodeToken, signToken } from '~/utils/jwt'
import { TokenType, UserVerifyStatus } from '~/constants/enum'
import {
    JWT_ACCESS_TOKEN_EXPIRATION,
    JWT_ACCESS_TOKEN_SECRET_KEY,
    JWT_REFRESH_TOKEN_SECRET_KEY,
    JWT_REFRESH_TOKEN_EXPIRATION,
    JWT_FORGOT_PASSWORD_TOKEN_SECRET_KEY,
    JWT_FORGOT_PASSWORD_TOKEN_EXPIRATION,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
} from '~/configs/env.config'
import { ObjectId } from 'mongodb'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import { userMessages } from '~/constants/messages'
import crypto from 'crypto'
import Follower from '~/models/schemas/Follower.schema'
import { ErrorsWithStatus } from '~/models/Errors'
import httpStatus from '~/constants/httpStatus'
import axios from 'axios'
import ms from 'ms'

class UsersService {
    private signAccessToken(user_id: string, verify: UserVerifyStatus) {
        return signToken({
            payload: {
                user_id,
                verify,
                token_type: TokenType.AccessToken
            },
            JWT_SECRET_KEY: JWT_ACCESS_TOKEN_SECRET_KEY as string,
            options: {
                expiresIn: JWT_ACCESS_TOKEN_EXPIRATION as any
            }
        })
    }

    private signRefreshToken(user_id: string, verify: UserVerifyStatus) {
        return signToken({
            payload: {
                user_id,
                verify,
                token_type: TokenType.RefreshToken
            },
            JWT_SECRET_KEY: JWT_REFRESH_TOKEN_SECRET_KEY as string,
            options: {
                expiresIn: JWT_REFRESH_TOKEN_EXPIRATION as any
            }
        })
    }

    private signBothTokens(user_id: string, verify: UserVerifyStatus) {
        return Promise.all([this.signAccessToken(user_id, verify), this.signRefreshToken(user_id, verify)])
    }

    private signForgotPasswordToken(user_id: string, verify: UserVerifyStatus) {
        return signToken({
            payload: {
                user_id,
                verify,
                token_type: TokenType.ForgotPasswordToken
            },
            JWT_SECRET_KEY: JWT_FORGOT_PASSWORD_TOKEN_SECRET_KEY as string,
            options: {
                expiresIn: JWT_FORGOT_PASSWORD_TOKEN_EXPIRATION as any
            }
        })
    }

    private async getOauthGoogleToken(code: string) {
        const body = {
            code,
            client_id: GOOGLE_CLIENT_ID,
            client_secret: GOOGLE_CLIENT_SECRET,
            redirect_uri: GOOGLE_REDIRECT_URI,
            grant_type: 'authorization_code'
        }
        const response = await axios.post('https://oauth2.googleapis.com/token', body, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })
        return response.data.access_token
    }

    private async getOauthGoogleUserInfo(access_token: string) {
        const response = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo', {
            headers: {
                Authorization: `Bearer ${access_token}`
            }
        })
        return response.data as {
            id: string
            email: string
            verified_email: boolean
            name: string
            given_name?: string
            family_name?: string
            picture?: string
            locale?: string
        }
    }

    async emailExists(email: string) {
        const user = await databaseService.users.findOne({ email })
        return !!user
    }

    async register(payload: RegisterReqBody) {
        const email_verify_token = crypto.randomBytes(32).toString('hex')
        const hashedPassword = await hashPassword(payload.password)
        const newUser = new User({
            ...payload, // Spread the payload to match User schema
            password: hashedPassword,
            date_of_birth: new Date(payload.date_of_birth), // Convert date_of_birth to Date object
            email_verify_token,
            username: 'user' + crypto.randomBytes(8).toString('hex') // Temporary username, user can change it later,
        })
        const result = await databaseService.users.insertOne(newUser)
        const user_id = result.insertedId.toString()
        const [access_token, refresh_token] = await this.signBothTokens(user_id, UserVerifyStatus.Unverified)
        // Store the refresh token in the database
        await databaseService.refreshTokens.insertOne(
            new RefreshToken({
                token: refresh_token,
                user_id: new ObjectId(user_id),
                expires_at: new Date(Date.now() + ms('7d'))
            })
        )
        return {
            access_token,
            refresh_token,
            email_verify_token
        }
    }

    async login(user_id: string, verify: UserVerifyStatus) {
        const [access_token, refresh_token] = await this.signBothTokens(user_id, verify)
        // Store the refresh token in the database
        await databaseService.refreshTokens.insertOne(
            new RefreshToken({
                token: refresh_token,
                user_id: new ObjectId(user_id),
                expires_at: new Date(Date.now() + ms('7d'))
            })
        )
        return {
            access_token,
            refresh_token
        }
    }

    async oauthGoogleService(code: string) {
        const access_token = await this.getOauthGoogleToken(code)
        const userInfo = await this.getOauthGoogleUserInfo(access_token)
        if (!userInfo.verified_email) {
            throw new ErrorsWithStatus(userMessages.gmailNotVerified, httpStatus.BAD_REQUEST)
        }
        // check if user already exist
        const user = await databaseService.users.findOne({ email: userInfo.email })
        // If user exists, login the user
        if (user) {
            const { access_token, refresh_token } = await this.login(user._id.toString(), user.verify)
            return {
                access_token,
                refresh_token
            }
        }
        // If not, register the user
        else {
            const { access_token, refresh_token } = await this.register({
                email: userInfo.email,
                name: userInfo.name,
                password: crypto.randomBytes(16).toString('hex'), // Generate a random password,
                confirm_password: '', // Not used in OAuth flow
                date_of_birth: new Date().toISOString(), // Default to current date, can be updated later
                avatar: userInfo.picture,
                verify: UserVerifyStatus.Verified,
                username: 'user' + crypto.randomBytes(8).toString('hex') // Temporary username, user can change it later
            })
            return {
                access_token,
                refresh_token
            }
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
        const [access_token, refresh_token] = await this.signBothTokens(user_id, UserVerifyStatus.Verified)
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

    async forgotPassword(user_id: string, verify: UserVerifyStatus) {
        const forgot_password_token = this.signForgotPasswordToken(user_id, verify)
        await databaseService.users.updateOne(
            { _id: new ObjectId(user_id) },
            {
                $set: {
                    forgot_password_token
                },
                $currentDate: { updated_at: true }
            }
        )
        // Here we would typically send the email with the token
        // For now, we just return the message for testing purposes
        return {
            message: userMessages.forgotPasswordEmailSent,
            forgot_password_token
        }
    }

    // async verifyForgotPasswordToken(user_id: string) {
    //     await databaseService.users.updateOne(
    //         { _id: new ObjectId(user_id) },
    //         {
    //             $set: {
    //                 forgot_password_token: ''
    //             },
    //             $currentDate: { updated_at: true }
    //         }
    //     )
    //     return {
    //         message: userMessages.forgotPasswordTokenVerified
    //     }
    // }

    async resetPassword(forgot_password_token: string, password: string) {
        const hashedPassword = await hashPassword(password)
        await databaseService.users.updateOne(
            { forgot_password_token },
            {
                $set: {
                    password: hashedPassword,
                    forgot_password_token: ''
                },
                $currentDate: { updated_at: true }
            }
        )
        return {
            message: userMessages.resetPasswordSuccess
        }
    }

    async refreshToken(refresh_token: string, user_id: string) {
        // Decode old refresh token to get exp
        const decoded_refresh_token = decodeToken(refresh_token)
        if (!decoded_refresh_token?.exp) {
            throw new Error('Invalid refresh token')
        }
        // Get current time in seconds to calculate the remaining expiration time
        const now = Math.floor(Date.now() / 1000)
        const expiresIn = decoded_refresh_token.exp - now
        if (expiresIn <= 0) {
            throw new Error('Refresh token expired')
        }
        // Sign new tokens
        const new_access_token = await this.signAccessToken(user_id, decoded_refresh_token.verify)
        const new_refresh_token = signToken({
            payload: {
                user_id,
                verify: decoded_refresh_token.verify,
                token_type: TokenType.RefreshToken
            },
            JWT_SECRET_KEY: JWT_REFRESH_TOKEN_SECRET_KEY as string,
            options: {
                expiresIn
            }
        })
        // Update the refresh token in DB
        await databaseService.refreshTokens.updateOne(
            { token: refresh_token },
            {
                $set: {
                    token: new_refresh_token
                },
                $currentDate: { updated_at: true }
            }
        )
        return {
            new_access_token,
            new_refresh_token,
            expiresIn // in seconds
        }
    }

    async getMe(user_id: string) {
        const user = await databaseService.users.findOne(
            { _id: new ObjectId(user_id) },
            {
                // projection is used to exclude sensitive fields
                projection: {
                    password: 0,
                    email_verify_token: 0,
                    forgot_password_token: 0
                }
            }
        )
        if (!user) {
            throw new Error(userMessages.userNotFound)
        }
        return user
    }

    async updateAboutMe(user_id: string, payload: UpdateAboutMeReqBody) {
        // Only update provided fields, do not replace the whole document
        const updateFields: Partial<User> = {}

        if (payload.name !== undefined) updateFields.name = payload.name
        if (payload.date_of_birth !== undefined) updateFields.date_of_birth = new Date(payload.date_of_birth)
        if (payload.bio !== undefined) updateFields.bio = payload.bio
        if (payload.location !== undefined) updateFields.location = payload.location
        if (payload.website !== undefined) updateFields.website = payload.website
        if (payload.username !== undefined) updateFields.username = payload.username
        if (payload.avatar !== undefined) updateFields.avatar = payload.avatar
        if (payload.cover_photo !== undefined) updateFields.cover_photo = payload.cover_photo

        // Always update updated_at
        updateFields.updated_at = new Date()

        const user = await databaseService.users.findOneAndUpdate(
            { _id: new ObjectId(user_id) },
            { $set: updateFields },
            {
                returnDocument: 'after',
                projection: {
                    password: 0,
                    email_verify_token: 0,
                    forgot_password_token: 0
                }
            }
        )
        return user
    }

    async getProfile(username: string) {
        const user = await databaseService.users.findOne(
            { username },
            {
                projection: {
                    password: 0,
                    email_verify_token: 0,
                    forgot_password_token: 0
                }
            }
        )
        if (!user) {
            throw new Error(userMessages.userNotFound)
        }
        return user
    }

    async follow(user_id: string, followed_user_id: string) {
        const userObjectId = new ObjectId(user_id)
        const followedUserObjectId = new ObjectId(followed_user_id)

        // Check if the user is already following the followed user
        const existingFollow = await databaseService.followers.findOne({
            user_id: userObjectId,
            followed_user_id: followedUserObjectId
        })

        if (existingFollow) {
            throw new ErrorsWithStatus(userMessages.alreadyFollowing, httpStatus.BAD_REQUEST)
        }

        // Update the user's following list
        await databaseService.followers.insertOne(
            new Follower({
                user_id: userObjectId,
                followed_user_id: followedUserObjectId
            })
        )
        return {
            message: userMessages.followSuccess,
            followed_user_id
        }
    }

    async unfollow(user_id: string, followed_user_id: string) {
        const userObjectId = new ObjectId(user_id)
        const followedUserObjectId = new ObjectId(followed_user_id)

        // Check if the user is following the followed user
        const existingFollow = await databaseService.followers.findOne({
            user_id: userObjectId,
            followed_user_id: followedUserObjectId
        })

        if (!existingFollow) {
            throw new ErrorsWithStatus(userMessages.notFollowing, httpStatus.BAD_REQUEST)
        }

        // Remove the follow relationship
        await databaseService.followers.deleteOne({
            user_id: userObjectId,
            followed_user_id: followedUserObjectId
        })
        return {
            message: userMessages.unfollowSuccess,
            followed_user_id
        }
    }

    async changePassword(user_id: string, new_password: string) {
        const hashedPassword = await hashPassword(new_password)
        await databaseService.users.updateOne(
            { _id: new ObjectId(user_id) },
            {
                $set: {
                    password: hashedPassword
                },
                $currentDate: { updated_at: true }
            }
        )
        return {
            message: userMessages.resetPasswordSuccess
        }
    }
}

const usersService = new UsersService()
export default usersService
