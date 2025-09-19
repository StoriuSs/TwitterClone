import { Server as HttpServer } from 'http'
import { Server } from 'socket.io'
import Message from '~/models/schemas/Message.schema'
import { ObjectId } from 'mongodb'
import { verifyToken } from './jwt'
import { JWT_ACCESS_TOKEN_SECRET_KEY, NODE_ENV, HOST, CLIENT_PORT } from '../configs/env.config'
import databaseService from '~/services/database.services'

const initSocket = (httpServer: HttpServer) => {
    const io = new Server(httpServer, {
        cors: {
            origin: NODE_ENV === 'production' ? HOST : `http://localhost:${CLIENT_PORT}`
        }
    })
    // Map to store userId and their corresponding socket.id
    const users = new Map<string, string>()

    io.use((socket, next) => {
        const access_token = socket.handshake.auth.token
        try {
            verifyToken(access_token, JWT_ACCESS_TOKEN_SECRET_KEY as string)
            next()
        } catch (error) {
            return next({
                message: 'Authentication error',
                name: 'UnauthorizedError',
                data: error
            })
        }
    })

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
}

export default initSocket
