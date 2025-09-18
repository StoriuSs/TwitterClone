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
import { Server } from 'socket.io'
import Message from './models/schemas/Message.schema'
import messageRouter from './routes/message.routes'
import { ObjectId } from 'mongodb'

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
const io = new Server(httpServer, {
    cors: {
        origin: NODE_ENV === 'production' ? HOST : `http://localhost:${CLIENT_PORT}`
    }
})
// Map to store userId and their corresponding socket.id
const users = new Map<string, string>()
io.on('connection', (socket) => {
    console.log('user connected: ' + socket.id)
    const user_id = socket.handshake.auth.userId
    users.set(user_id, socket.id) // Map user ID to socket ID

    // Broadcast updated online users list to all clients
    io.emit('online_users', Array.from(users.keys()))

    socket.on('disconnect', () => {
        console.log('user disconnected: ' + socket.id)
        users.delete(user_id) // Remove user from map on disconnect
        // Broadcast updated online users list to all clients
        io.emit('online_users', Array.from(users.keys()))
    })
    socket.on('send_message', async (payload) => {
        const to_user = payload.to_user
        const message = payload.content

        // Create message object
        const messageData = {
            from_user: user_id,
            to_user: to_user,
            content: message,
            created_at: new Date(),
            updated_at: new Date(),
            read_at: null
        }

        // Send the message to the intended recipient
        const recipientSocketId = users.get(to_user)
        if (recipientSocketId) {
            io.to(recipientSocketId).emit('new_message', messageData)
        }

        // Also send back to sender so they see their own message
        socket.emit('new_message', messageData)

        // Save the message to the database
        await databaseService.messages.insertOne(
            new Message({
                from_user: new ObjectId(messageData.from_user),
                to_user: new ObjectId(messageData.to_user),
                content: messageData.content,
                created_at: messageData.created_at,
                updated_at: messageData.updated_at,
                read_at: messageData.read_at
            })
        )
    })
})

// Swagger documentation
const file = fs.readFileSync('./twitter-swagger.yaml', 'utf8')
const swaggerDocument = YAML.parse(file)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})
