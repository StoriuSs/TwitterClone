import { wrapRequestHandler } from './../utils/handler'
import { Router } from 'express'
import { uploadImageController } from '~/controllers/medias.controllers'

const mediasRouter = Router()

mediasRouter.post('/upload-image', wrapRequestHandler(uploadImageController))

export default mediasRouter
