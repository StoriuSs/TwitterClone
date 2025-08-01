import express from 'express'
import { PORT } from './configs/env.config'
import databaseService from './services/database.services'
import usersRouter from '~/routes/users.routes'
import { errorHandler } from './middlewares/errors.middlewares'
import cookieParser from 'cookie-parser'

const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
databaseService.connect()
// Routes
app.use('/api/users', usersRouter)
// Error handling middleware
app.use(errorHandler)
app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}`)
})
