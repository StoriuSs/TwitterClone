import { Request, Response } from 'express'
import usersService from '~/services/users.services'
import { ParamsDictionary } from 'express-serve-static-core'
import { LogoutReqBody, RegisterReqBody } from '~/models/requests/User.requests'
import User from '~/models/schemas/User.schema'
import { userMessages } from '~/constants/messages'
import { NODE_ENV } from '~/configs/env.config'
import ms from 'ms'

export const registerController = async (req: Request<ParamsDictionary, any, RegisterReqBody>, res: Response) => {
    const { access_token, refresh_token } = await usersService.register(req.body)
    res.cookie('refresh_token', refresh_token, {
        httpOnly: true,
        secure: NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: ms('7d')
    })
    return res.status(201).json({
        message: userMessages.userRegistered,
        result: {
            access_token
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
