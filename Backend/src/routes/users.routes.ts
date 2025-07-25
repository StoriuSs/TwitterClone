import { wrapRequestHandler } from './../utils/handler'
import { Router } from 'express'
import { registerValidator, loginValidator } from './../middlewares/users.middlewares'
import { registerController, loginController } from '~/controllers/users.controllers'

const usersRouter = Router()
usersRouter.post('/register', registerValidator, wrapRequestHandler(registerController))
usersRouter.post('/login', loginValidator, loginController)

export default usersRouter
