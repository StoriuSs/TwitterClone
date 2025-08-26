import { ParamsDictionary } from 'express-serve-static-core'
import { Request, Response } from 'express'
import { TweetReqBody } from '~/models/requests/Tweet.requests'
import tweetsService from '~/services/tweets.services'
import { tweetMessages } from '~/constants/messages'
import { TokenPayload } from '~/models/requests/User.requests'
import httpStatus from '~/constants/httpStatus'

export const createTweetController = async (req: Request<ParamsDictionary, any, TweetReqBody>, res: Response) => {
    const { user_id } = req.decoded_authorization as TokenPayload
    await tweetsService.createTweet(req.body, user_id)
    res.status(httpStatus.CREATED).json({
        message: tweetMessages.tweetCreated
    })
}
