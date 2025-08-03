import { Request, Response } from 'express'
import usersService from '~/services/users.services'
import { ParamsDictionary } from 'express-serve-static-core'
import {
    ForgotPasswordReqBody,
    LogoutReqBody,
    RegisterReqBody,
    TokenPayload,
    UpdateAboutMeReqBody
} from '~/models/requests/User.requests'
import User from '~/models/schemas/User.schema'
import { userMessages } from '~/constants/messages'
import { NODE_ENV } from '~/configs/env.config'
import ms from 'ms'
import httpStatus from '~/constants/httpStatus'
import databaseService from '~/services/database.services'
import { ObjectId } from 'mongodb'
import { UserVerifyStatus } from '~/constants/enum'

export const registerController = async (req: Request<ParamsDictionary, any, RegisterReqBody>, res: Response) => {
    const { access_token, refresh_token, email_verify_token } = await usersService.register(req.body)
    res.cookie('refresh_token', refresh_token, {
        httpOnly: true,
        secure: NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: ms('7d')
    })
    return res.status(201).json({
        message: userMessages.userRegistered,
        result: {
            access_token,
            // THIS IS FOR TESTING PURPOSES, THE REFRESH TOKEN IS STORED IN A HTTP-ONLY COOKIE
            refresh_token,
            // Here we typically send the email with the token, but for testing purposes, we return it here
            email_verify_token
        }
    })
}

export const loginController = async (req: Request, res: Response) => {
    const user = req.user as User
    const user_id = user._id
    const { access_token, refresh_token } = await usersService.login(user_id.toString(), user.verify)
    res.cookie('refresh_token', refresh_token, {
        httpOnly: true,
        secure: NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: ms('7d')
    })
    return res.status(200).json({
        message: userMessages.userLoggedIn,
        result: {
            access_token,
            // THIS IS FOR TESTING PURPOSES, THE REFRESH TOKEN IS STORED IN A HTTP-ONLY COOKIE
            refresh_token
        }
    })
}

export const logoutController = async (req: Request<ParamsDictionary, any, LogoutReqBody>, res: Response) => {
    const refresh_token = req.cookies.refresh_token
    const result = await usersService.logout(refresh_token)
    res.clearCookie('refresh_token', {
        httpOnly: true,
        secure: NODE_ENV === 'production',
        sameSite: 'strict'
    })
    return res.json(result)
}

export const emailVerifyController = async (req: Request, res: Response) => {
    const user = req.user as User
    const user_id = user._id.toString()
    const result = await usersService.verifyEmail(user_id)
    res.json({
        message: userMessages.emailVerifiedSuccessfully,
        result
    })
}

export const resendEmailVerifyController = async (req: Request, res: Response) => {
    const { user_id } = req.decoded_authorization as TokenPayload
    const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
    // Check if user exists and is not already verified
    if (!user) {
        return res.status(httpStatus.NOT_FOUND).json({ message: userMessages.userNotFound })
    }
    if (user.verify === UserVerifyStatus.Verified) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: userMessages.emailAlreadyVerified })
    }

    const result = await usersService.resendVerifyEmail(user_id)
    return res.json(result)
}

export const forgotPasswordController = async (
    req: Request<ParamsDictionary, any, ForgotPasswordReqBody>,
    res: Response
) => {
    const { _id, verify } = req.user as User
    const result = await usersService.forgotPassword(_id.toString(), verify)
    return res.json(result)
}

export const verifyForgotPasswordController = async (req: Request, res: Response) => {
    // const user = req.user as User
    // const user_id = user._id.toString()
    // const result = await usersService.verifyForgotPasswordToken(user_id)
    return res.json({
        message: userMessages.forgotPasswordTokenVerified
    })
}

export const resetPasswordController = async (req: Request, res: Response) => {
    const { forgot_password_token, password } = req.body
    const result = await usersService.resetPassword(forgot_password_token, password)
    return res.json(result)
}

export const refreshTokenController = async (req: Request, res: Response) => {
    const refresh_token = req.cookies.refresh_token
    const { user_id } = req.decoded_refresh_token as TokenPayload
    const { new_access_token, new_refresh_token, expiresIn } = await usersService.refreshToken(refresh_token, user_id)
    res.cookie('refresh_token', new_refresh_token, {
        httpOnly: true,
        secure: NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: expiresIn * 1000 // convert to milliseconds
    })
    return res.json({
        message: userMessages.refreshTokenSuccess,
        result: {
            access_token: new_access_token,
            // THIS IS FOR TESTING PURPOSES, THE REFRESH TOKEN IS STORED IN A HTTP-ONLY COOKIE
            refresh_token: new_refresh_token
        }
    })
}

export const getAboutMeController = async (req: Request, res: Response) => {
    const { user_id } = req.decoded_authorization as TokenPayload
    const user = await usersService.getMe(user_id)
    return res.json({
        message: userMessages.userRetrievedSuccessfully,
        result: user
    })
}

export const updateAboutMeController = async (
    req: Request<ParamsDictionary, any, UpdateAboutMeReqBody>,
    res: Response
) => {
    const { user_id } = req.decoded_authorization as TokenPayload
    const body = req.body
    const payload = { ...body, date_of_birth: body.date_of_birth ? new Date(body.date_of_birth) : undefined }
    const user = await usersService.updateAboutMe(user_id, payload as UpdateAboutMeReqBody)

    return res.json({
        message: userMessages.userUpdated,
        result: user
    })
}

export const getProfileController = async (req: Request, res: Response) => {
    const { username } = req.params
    const user = await usersService.getProfile(username)
    if (!user) {
        return res.status(httpStatus.NOT_FOUND).json({ message: userMessages.userNotFound })
    }
    return res.json({
        message: userMessages.userRetrievedSuccessfully,
        result: user
    })
}

export const followController = async (req: Request, res: Response) => {
    const { user_id } = req.decoded_authorization as TokenPayload
    const { followed_user_id } = req.body
    const result = await usersService.follow(user_id, followed_user_id)
    return res.json({
        message: userMessages.followSuccess,
        result
    })
}

export const unfollowController = async (req: Request, res: Response) => {
    const { user_id } = req.decoded_authorization as TokenPayload
    const { user_id: followed_user_id } = req.params
    const result = await usersService.unfollow(user_id, followed_user_id)
    return res.json({
        message: userMessages.unfollowSuccess,
        result
    })
}

export const changePasswordController = async (req: Request, res: Response) => {
    const new_password = req.body.new_password
    const { user_id } = req.decoded_authorization as TokenPayload
    const result = await usersService.changePassword(user_id, new_password)
    return res.json(result)
}
