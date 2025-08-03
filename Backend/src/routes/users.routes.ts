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
    verifiedUserValidator,
    followValidator,
    unfollowValidator,
    changePasswordValidator
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
    updateAboutMeController,
    getProfileController,
    followController,
    unfollowController,
    changePasswordController
} from '~/controllers/users.controllers'

import { filterDataFromBody } from '~/middlewares/common.middlewares'

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
    filterDataFromBody([
        'name',
        'email',
        'date_of_birth',
        'bio',
        'location',
        'website',
        'username',
        'avatar',
        'cover_photo'
    ]),
    wrapRequestHandler(updateAboutMeController)
)
usersRouter.get('/:username', wrapRequestHandler(getProfileController))
usersRouter.post(
    '/follow',
    accessTokenValidator,
    verifiedUserValidator,
    followValidator,
    wrapRequestHandler(followController)
)
usersRouter.delete(
    '/follow/:user_id',
    accessTokenValidator,
    verifiedUserValidator,
    unfollowValidator,
    wrapRequestHandler(unfollowController)
)
usersRouter.put(
    '/change-password',
    accessTokenValidator,
    verifiedUserValidator,
    changePasswordValidator,
    wrapRequestHandler(changePasswordController)
)

export default usersRouter
