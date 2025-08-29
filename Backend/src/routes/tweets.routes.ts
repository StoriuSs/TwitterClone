import { accessTokenValidator, isUserLoggedInValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
import { Router } from 'express'
import { wrapRequestHandler } from '~/utils/handler'
import { createTweetController, getTweetByIdController } from '~/controllers/tweets.controllers'
import { audienceValidator, createTweetValidator, getTweetByIdValidator } from '~/middlewares/tweets.middleware'

const tweetsRouter = Router()

tweetsRouter.post(
    '/',
    accessTokenValidator,
    verifiedUserValidator,
    createTweetValidator,
    wrapRequestHandler(createTweetController)
)

tweetsRouter.get(
    '/:tweet_id',
    getTweetByIdValidator,
    isUserLoggedInValidator(accessTokenValidator),
    isUserLoggedInValidator(verifiedUserValidator),
    audienceValidator,
    wrapRequestHandler(getTweetByIdController)
)

export default tweetsRouter
