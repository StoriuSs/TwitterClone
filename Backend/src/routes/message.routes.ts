import { wrapRequestHandler } from './../utils/handler'
import { getMessagesValidator } from './../middlewares/users.middlewares'
import { Router } from 'express'
import { getMessagesController } from '~/controllers/messages.controllers'
import { paginationValidator } from '~/middlewares/tweets.middleware'
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'

const messageRouter = Router()

messageRouter.get(
    '/recipients/:recipientId',
    accessTokenValidator,
    verifiedUserValidator,
    paginationValidator,
    getMessagesValidator,
    wrapRequestHandler(getMessagesController)
)

export default messageRouter
