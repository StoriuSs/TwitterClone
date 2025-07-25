import { Request, Response } from 'express'
import usersService from '~/services/users.services'
import { ParamsDictionary } from 'express-serve-static-core'
import { RegisterReqBody } from '~/models/requests/User.requests'
import User from '~/models/schemas/User.schema'
import { userMessages } from '~/constants/messages'

export const registerController = async (req: Request<ParamsDictionary, any, RegisterReqBody>, res: Response) => {
    const result = await usersService.register(req.body)
    return res.status(201).json({
        message: userMessages.userRegistered,
        result
    })
}

export const loginController = async (req: Request, res: Response) => {
    const user = req.user as User
    const user_id = user._id
    const result = await usersService.login(user_id.toString())
    return res.status(200).json({
        message: userMessages.userLoggedIn,
        result
    })
}
