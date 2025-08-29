import { Router } from 'express'
import { createLikeController, deleteLikeController } from '~/controllers/likes.controllers'
import { createLikeValidator, deleteLikeValidator } from '~/middlewares/likes.middlewares'
import { getTweetByIdValidator } from '~/middlewares/tweets.middleware'
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handler'

const likesRouter = Router()

likesRouter.post(
    '/',
    getTweetByIdValidator,
    accessTokenValidator,
    verifiedUserValidator,
    createLikeValidator,
    wrapRequestHandler(createLikeController)
)

likesRouter.delete(
    '/tweets/:tweet_id',
    getTweetByIdValidator,
    accessTokenValidator,
    verifiedUserValidator,
    deleteLikeValidator,
    wrapRequestHandler(deleteLikeController)
)

export default likesRouter
