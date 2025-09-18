import { Request, Response } from 'express'
import httpStatus from '~/constants/httpStatus'
import { userMessages } from '~/constants/messages'
import { MessageRequestParams } from '~/models/requests/Message.requests'
import messagesServices from '~/services/messages.services'

export const getMessagesController = async (req: Request<MessageRequestParams>, res: Response) => {
    const senderId = req.decoded_authorization?.user_id as string
    const recipientId = req.params.recipientId
    const limit = parseInt(req.query.limit as string) || 20
    const page = parseInt(req.query.page as string) || 1

    const { messages, totalPages } = await messagesServices.getMessagesByRecipientIdService(
        senderId,
        recipientId,
        limit,
        page
    )

    res.status(httpStatus.OK).json({ message: userMessages.messagesRetrieved, limit, page, totalPages, data: messages })
}
