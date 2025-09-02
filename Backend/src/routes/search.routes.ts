import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'
import { Router } from 'express'
import { searchController } from '~/controllers/search.controllers'
import { searchQueryValidator } from '~/middlewares/search.middlewares'
import { wrapRequestHandler } from '~/utils/handler'

const searchRouter = Router()

searchRouter.get(
    '/',
    accessTokenValidator,
    verifiedUserValidator,
    searchQueryValidator,
    wrapRequestHandler(searchController)
)
export default searchRouter
