import { wrapRequestHandler } from './../utils/handler'
import { Router } from 'express'
import { registerValidator } from './../middlewares/users.middlewares'
import { registerController, loginController } from '~/controllers/users.controllers'

const usersRouter = Router()
usersRouter.post('/register', registerValidator, wrapRequestHandler(registerController))
usersRouter.post('/login', loginController)

export default usersRouter
