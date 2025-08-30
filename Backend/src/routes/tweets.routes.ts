import { accessTokenValidator, isUserLoggedInValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
import { Router } from 'express'
import { wrapRequestHandler } from '~/utils/handler'
import {
    createTweetController,
    getTweetByIdController,
    getTweetChildrenController
} from '~/controllers/tweets.controllers'
import {
    audienceValidator,
    createTweetValidator,
    getTweetByIdValidator,
    getTweetChildrenValidator
} from '~/middlewares/tweets.middleware'

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

tweetsRouter.get(
    '/:tweet_id/children',
    getTweetByIdValidator,
    getTweetChildrenValidator,
    isUserLoggedInValidator(accessTokenValidator),
    isUserLoggedInValidator(verifiedUserValidator),
    audienceValidator,
    wrapRequestHandler(getTweetChildrenController)
)
export default tweetsRouter
