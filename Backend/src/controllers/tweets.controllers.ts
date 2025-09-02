import { ParamsDictionary } from 'express-serve-static-core'
import { Request, Response } from 'express'
import { NewsFeedQuery, TweetParam, TweetQuery, TweetReqBody } from '~/models/requests/Tweet.requests'
import tweetsService from '~/services/tweets.services'
import { tweetMessages } from '~/constants/messages'
import { TokenPayload } from '~/models/requests/User.requests'
import httpStatus from '~/constants/httpStatus'
import Tweet from '~/models/schemas/Tweet.schema'
import { WithId } from 'mongodb'
import { TweetType } from '~/constants/enum'

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
            user_views: result.user_views,
            updated_at: result.updated_at
        }
    })
}

export const getTweetChildrenController = async (req: Request<TweetParam, any, any, TweetQuery>, res: Response) => {
    const user = (req.decoded_authorization as TokenPayload) || {}
    const tweet_id = req.params.tweet_id
    const tweet_type = Number(req.query.type) as TweetType
    const page = Number(req.query.page)
    const limit = Number(req.query.limit)

    const { tweets, totalItems } = await tweetsService.getTweetChildren({
        user_id: user.user_id,
        tweet_id,
        tweet_type,
        page,
        limit
    })
    return res.json({
        message: tweetMessages.tweetChildrenRetrieved,
        result: {
            tweet_type,
            totalPages: Math.ceil(totalItems / limit),
            page,
            limit,
            tweets
        }
    })
}

export const getNewsFeedController = async (req: Request<ParamsDictionary, any, any, NewsFeedQuery>, res: Response) => {
    const user = (req.decoded_authorization as TokenPayload) || {}
    const page = Number(req.query.page)
    const limit = Number(req.query.limit)
    const source = req.query.source

    const { tweets, totalItems } = await tweetsService.getNewsFeed({
        user_id: user.user_id,
        page,
        limit,
        source
    })
    return res.json({
        message: tweetMessages.newsFeedRetrieved,
        result: {
            page,
            total_pages: Math.ceil(totalItems / limit),
            limit,
            tweets
        }
    })
}
