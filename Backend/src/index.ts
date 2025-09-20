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
import tweetsRouter from './routes/tweets.routes'
import bookmarksRouter from './routes/bookmarks.routes'
import likesRouter from './routes/likes.routes'
import swaggerUi from 'swagger-ui-express'
import YAML from 'yaml'
import fs from 'fs'
import searchRouter from './routes/search.routes'
import { createServer } from 'http'
import messageRouter from './routes/message.routes'
import initSocket from './utils/socket'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'

const app = express()

// Rate Limiter
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
    standardHeaders: 'draft-8', // draft-6: `RateLimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
    ipv6Subnet: 56 // Set to 60 or 64 to be less aggressive, or 52 or 48 to be more aggressive
})
app.use(limiter)

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
app.use(helmet())

// Connect to database
databaseService.connect().then(() => {
    databaseService.indexUsers()
    databaseService.indexRefreshTokens()
    databaseService.indexVideoStatuses()
    databaseService.indexFollowers()
    databaseService.indexLikes()
    databaseService.indexBookmarks()
    databaseService.indexHashtags()
    databaseService.indexTweets()
})

// Initialize upload folder
initFolder()

// Routes
app.use('/api/users', usersRouter)
app.use('/api/medias', mediasRouter)
app.use('/static', staticRouter)
app.use('/api/tweets', tweetsRouter)
app.use('/api/bookmarks', bookmarksRouter)
app.use('/api/likes', likesRouter)
app.use('/api/search', searchRouter)
app.use('/api/messages', messageRouter)
// Error handling middleware
app.use(errorHandler)

// Socket.io setup
const httpServer = createServer(app)
initSocket(httpServer)

// Swagger documentation
const file = fs.readFileSync('./twitter-swagger.yaml', 'utf8')
const swaggerDocument = YAML.parse(file)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})
