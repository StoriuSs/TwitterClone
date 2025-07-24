import { Request, Response } from 'express'
import usersService from '~/services/users.services'
import { ParamsDictionary } from 'express-serve-static-core'
import { RegisterReqBody } from '~/models/requests/User.requests'

export const registerController = async (req: Request<ParamsDictionary, any, RegisterReqBody>, res: Response) => {
    const result = await usersService.register(req.body)
    return res.status(201).json({
        message: 'User registered successfully',
        data: {
            result
        }
    })
}

export const loginController = async (req: Request, res: Response) => {
    const { email, password } = req.body
    if (email === 'hieupt1003@gmail.com' && password === '123456') {
        return res.status(200).send('Login successful')
    }
    res.status(401).send('Invalid email or password')
}
