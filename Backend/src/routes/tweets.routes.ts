import { accessTokenValidator, isUserLoggedInValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
import { Router } from 'express'
import { wrapRequestHandler } from '~/utils/handler'
import {
    createTweetController,
    getTweetByIdController,
    getTweetChildrenController,
    getNewsFeedController
} from '~/controllers/tweets.controllers'
import {
    audienceValidator,
    createTweetValidator,
    getTweetByIdValidator,
    getTweetChildrenValidator,
    paginationValidator
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
    paginationValidator,
    getTweetChildrenValidator,
    isUserLoggedInValidator(accessTokenValidator),
    isUserLoggedInValidator(verifiedUserValidator),
    audienceValidator,
    wrapRequestHandler(getTweetChildrenController)
)

tweetsRouter.get(
    '/',
    paginationValidator,
    isUserLoggedInValidator(accessTokenValidator),
    isUserLoggedInValidator(verifiedUserValidator),
    // the audienceValidator is not here because the aggregation in the controller handles which tweet to show
    wrapRequestHandler(getNewsFeedController)
)
export default tweetsRouter
