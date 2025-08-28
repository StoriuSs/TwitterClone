import { Router } from 'express'
import { createBookmarkController, deleteBookmarkController } from '~/controllers/bookmarks.controllers'
import { createBookmarkValidator, deleteBookmarkValidator } from '~/middlewares/bookmarks.middlewares'
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
import { wrapRequestHandler } from '~/utils/handler'

const bookmarksRouter = Router()

bookmarksRouter.post(
    '/',
    accessTokenValidator,
    verifiedUserValidator,
    createBookmarkValidator,
    wrapRequestHandler(createBookmarkController)
)

bookmarksRouter.delete(
    '/tweets/:tweet_id',
    accessTokenValidator,
    verifiedUserValidator,
    deleteBookmarkValidator,
    wrapRequestHandler(deleteBookmarkController)
)

export default bookmarksRouter
