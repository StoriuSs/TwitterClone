import { Request, Response } from 'express'
import usersService from '~/services/users.services'
import { ParamsDictionary } from 'express-serve-static-core'
import { ForgotPasswordReqBody, LogoutReqBody, RegisterReqBody, TokenPayload } from '~/models/requests/User.requests'
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
    const { access_token, refresh_token } = await usersService.login(user_id.toString())
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
    const { email } = req.body
    if (!email) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: userMessages.emailIsRequired })
    }
    const result = await usersService.forgotPassword(email)
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

export const aboutMeController = async (req: Request, res: Response) => {
    const { user_id } = req.decoded_authorization as TokenPayload
    const user = await usersService.getMe(user_id)
    return res.json({
        message: userMessages.userRetrievedSuccessfully,
        result: user
    })
}
