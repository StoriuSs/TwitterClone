import { ParamsDictionary } from 'express-serve-static-core'
import { Request, Response } from 'express'
import { TokenPayload } from '~/models/requests/User.requests'
import httpStatus from '~/constants/httpStatus'
import { LikeTweetReqBody } from '~/models/requests/Like.requests'
import likesService from '~/services/likes.services'
import { tweetMessages } from '~/constants/messages'

export const createLikeController = async (req: Request<ParamsDictionary, any, LikeTweetReqBody>, res: Response) => {
    const { user_id } = req.decoded_authorization as TokenPayload
    await likesService.createLike(req.body.tweet_id, user_id)
    res.status(httpStatus.CREATED).json({
        message: tweetMessages.tweetLiked
    })
}

export const deleteLikeController = async (req: Request, res: Response) => {
    const { user_id } = req.decoded_authorization as TokenPayload
    await likesService.removeLike(req.params.tweet_id, user_id)
    res.status(httpStatus.OK).json({
        message: tweetMessages.tweetUnliked
    })
}
