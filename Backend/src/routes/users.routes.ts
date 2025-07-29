import { wrapRequestHandler } from './../utils/handler'
import { Router } from 'express'
import {
    registerValidator,
    loginValidator,
    accessTokenValidator,
    refreshTokenValidator,
    emailVerifyTokenValidator
} from './../middlewares/users.middlewares'
import {
    registerController,
    loginController,
    logoutController,
    emailVerifyController,
    resendEmailVerifyController
} from '~/controllers/users.controllers'

const usersRouter = Router()
usersRouter.post('/register', registerValidator, wrapRequestHandler(registerController))
usersRouter.post('/login', loginValidator, wrapRequestHandler(loginController))
usersRouter.post('/logout', accessTokenValidator, refreshTokenValidator, wrapRequestHandler(logoutController))
usersRouter.post('/verify-email', emailVerifyTokenValidator, wrapRequestHandler(emailVerifyController))
usersRouter.post('/resend-verify-email', accessTokenValidator, wrapRequestHandler(resendEmailVerifyController))
export default usersRouter
