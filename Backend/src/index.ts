import express from 'express'
import { PORT } from './configs/env.config'
import databaseService from './services/database.services'
import usersRouter from '~/routes/users.routes'
import { errorHandler } from './middlewares/errors.middlewares'
import cookieParser from 'cookie-parser'
import mediasRouter from './routes/medias.routes'
import { initFolder } from './utils/file'
import staticRouter from './routes/static.routes'

const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
databaseService.connect()

// Initialize upload folder
initFolder()

// Routes
app.use('/api/users', usersRouter)
app.use('/api/medias', mediasRouter)
app.use('/static', staticRouter)

// Error handling middleware
app.use(errorHandler)
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})
