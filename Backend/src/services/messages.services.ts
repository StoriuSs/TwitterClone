import databaseService from './database.services'
import { ObjectId } from 'mongodb'

class MessagesServices {
    async getMessagesByRecipientIdService(senderId: string, recipientId: string, limit: number, page: number) {
        const messages = await databaseService.messages
            .find({
                $or: [
                    { from_user: new ObjectId(senderId), to_user: new ObjectId(recipientId) },
                    { from_user: new ObjectId(recipientId), to_user: new ObjectId(senderId) }
                ]
            })
            .sort({ created_at: -1 }) // Sort by newest first
            .skip((page - 1) * limit)
            .limit(limit)
            .toArray()
        const totalMessages = await databaseService.messages.countDocuments({
            $or: [
                { from_user: new ObjectId(senderId), to_user: new ObjectId(recipientId) },
                { from_user: new ObjectId(recipientId), to_user: new ObjectId(senderId) }
            ]
        })
        const totalPages = Math.ceil(totalMessages / limit)
        return { messages, totalPages }
    }
}

const messagesServices = new MessagesServices()
export default messagesServices
