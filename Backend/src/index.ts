import express from 'express'
import { HOST, NODE_ENV, CLIENT_PORT, PORT } from './configs/env.config'
import databaseService from './services/database.services'
import usersRouter from '~/routes/users.routes'
import { errorHandler } from './middlewares/errors.middlewares'
import cookieParser from 'cookie-parser'
import mediasRouter from './routes/medias.routes'
import { initFolder } from './utils/file'
import staticRouter from './routes/static.routes'
import cors from 'cors'

const app = express()
// CORS
app.use(
    cors({
        origin: NODE_ENV === 'production' ? HOST : `http://localhost:${CLIENT_PORT}`,
        credentials: true, // Allow cookies to be sent with requests
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
    })
)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
databaseService.connect().then(() => {
    databaseService.indexUsers()
    databaseService.indexRefreshTokens()
    databaseService.indexVideoStatuses()
    databaseService.indexFollowers()
})

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
