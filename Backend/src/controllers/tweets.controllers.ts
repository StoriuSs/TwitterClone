import { ParamsDictionary } from 'express-serve-static-core'
import { Request, Response } from 'express'
import { TweetReqBody } from '~/models/requests/Tweet.requests'
import tweetsService from '~/services/tweets.services'
import { tweetMessages } from '~/constants/messages'
import { TokenPayload } from '~/models/requests/User.requests'
import httpStatus from '~/constants/httpStatus'
import Tweet from '~/models/schemas/Tweet.schema'
import { WithId } from 'mongodb'

export const createTweetController = async (req: Request<ParamsDictionary, any, TweetReqBody>, res: Response) => {
    const { user_id } = req.decoded_authorization as TokenPayload
    await tweetsService.createTweet(req.body, user_id)
    res.status(httpStatus.CREATED).json({
        message: tweetMessages.tweetCreated
    })
}

export const getTweetByIdController = async (req: Request, res: Response) => {
    const tweet = req.tweet as Tweet
    const user = (req.decoded_authorization as TokenPayload) || {}
    const result = (await tweetsService.increaseViews(tweet._id.toString(), user.user_id)) as WithId<Tweet>
    return res.json({
        message: tweetMessages.tweetRetrieved,
        result: {
            ...tweet,
            guest_views: result.guest_views,
            user_views: result.user_views
        }
    })
}
