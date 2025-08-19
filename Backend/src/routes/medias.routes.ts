import { wrapRequestHandler } from './../utils/handler'
import { Router } from 'express'
import { uploadImageController, uploadVideoController } from '~/controllers/medias.controllers'
import { accessTokenValidator, verifiedUserValidator } from '~/middlewares/users.middlewares'

const mediasRouter = Router()

mediasRouter.post(
    '/upload-image',
    accessTokenValidator,
    verifiedUserValidator,
    wrapRequestHandler(uploadImageController)
)
mediasRouter.post(
    '/upload-video',
    accessTokenValidator,
    verifiedUserValidator,
    wrapRequestHandler(uploadVideoController)
)

export default mediasRouter
