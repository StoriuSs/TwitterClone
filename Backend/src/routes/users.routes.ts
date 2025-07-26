import { wrapRequestHandler } from './../utils/handler'
import { Router } from 'express'
import {
    registerValidator,
    loginValidator,
    accessTokenValidator,
    refreshTokenValidator
} from './../middlewares/users.middlewares'
import { registerController, loginController, logoutController } from '~/controllers/users.controllers'

const usersRouter = Router()
usersRouter.post('/register', registerValidator, wrapRequestHandler(registerController))
usersRouter.post('/login', loginValidator, wrapRequestHandler(loginController))
usersRouter.post('/logout', accessTokenValidator, refreshTokenValidator, wrapRequestHandler(logoutController))
export default usersRouter
