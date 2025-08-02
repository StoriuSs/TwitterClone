import { wrapRequestHandler } from './../utils/handler'
import { Router } from 'express'
import {
    registerValidator,
    loginValidator,
    accessTokenValidator,
    refreshTokenValidator,
    emailVerifyTokenValidator,
    forgotPasswordValidator,
    verifyForgotPasswordTokenValidator,
    resetPasswordValidator,
    updateAboutMeValidator,
    verifiedUserValidator
} from './../middlewares/users.middlewares'
import {
    registerController,
    loginController,
    logoutController,
    refreshTokenController,
    emailVerifyController,
    resendEmailVerifyController,
    forgotPasswordController,
    verifyForgotPasswordController,
    resetPasswordController,
    getAboutMeController,
    updateAboutMeController
} from '~/controllers/users.controllers'

const usersRouter = Router()
usersRouter.post('/register', registerValidator, wrapRequestHandler(registerController))
usersRouter.post('/login', loginValidator, wrapRequestHandler(loginController))
usersRouter.post('/logout', accessTokenValidator, refreshTokenValidator, wrapRequestHandler(logoutController))
usersRouter.get('/verify-email/:token', emailVerifyTokenValidator, wrapRequestHandler(emailVerifyController))
usersRouter.post('/resend-verify-email', accessTokenValidator, wrapRequestHandler(resendEmailVerifyController))
usersRouter.post('/forgot-password', forgotPasswordValidator, wrapRequestHandler(forgotPasswordController))
usersRouter.get(
    '/verify-forgot-password/:token',
    verifyForgotPasswordTokenValidator,
    wrapRequestHandler(verifyForgotPasswordController)
)
usersRouter.post('/reset-password', resetPasswordValidator, wrapRequestHandler(resetPasswordController))
usersRouter.post('/refresh-token', refreshTokenValidator, wrapRequestHandler(refreshTokenController))
usersRouter.get('/about-me', accessTokenValidator, verifiedUserValidator, wrapRequestHandler(getAboutMeController))
usersRouter.patch(
    '/about-me',
    accessTokenValidator,
    verifiedUserValidator,
    updateAboutMeValidator,
    wrapRequestHandler(updateAboutMeController)
)
export default usersRouter
