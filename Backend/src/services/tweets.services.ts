import { TweetReqBody } from '~/models/requests/Tweet.requests'
import databaseService from './database.services'
import Tweet from '~/models/schemas/Tweet.schema'
import { ObjectId, WithId } from 'mongodb'
import Hashtag from '~/models/schemas/Hashtag.schema'
import { TweetType } from '~/constants/enum'

class TweetsService {
    async findOneAndUpdateHashtags(hashtags: string[]) {
        const hashtagPromises = await Promise.all(
            hashtags.map((hashtag) => {
                // find hashtag in db, if exists, get it, or else create a new one
                return databaseService.hashtags.findOneAndUpdate(
                    { name: hashtag },
                    { $setOnInsert: new Hashtag({ name: hashtag }) },
                    { upsert: true, returnDocument: 'after' }
                )
            })
        )
        return hashtagPromises.map((hashtag) => (hashtag as WithId<Hashtag>)._id)
    }

    async createTweet(body: TweetReqBody, user_id: string) {
        const hashtags = await this.findOneAndUpdateHashtags(body.hashtags)
        await databaseService.tweets.insertOne(
            new Tweet({
                type: body.type,
                audience: body.audience,
                content: body.content,
                parent_id: body.parent_id ? new ObjectId(body.parent_id) : null,
                hashtags,
                mentions: body.mentions.map((mention) => new ObjectId(mention)),
                medias: body.medias,
                user_id: new ObjectId(user_id)
            })
        )
    }

    async increaseViews(tweet_id: string, user_id?: string) {
        const incType = user_id ? { user_views: 1 } : { guest_views: 1 }
        const result = await databaseService.tweets.findOneAndUpdate(
            { _id: new ObjectId(tweet_id) },
            {
                $inc: incType,
                $currentDate: {
                    updated_at: true
                }
            },
            {
                returnDocument: 'after',
                projection: {
                    user_views: 1,
                    guest_views: 1,
                    updated_at: 1
                }
            }
        )
        return result
    }

    async getTweetChildren({
        user_id,
        tweet_id,
        tweet_type,
        page,
        limit
    }: {
        user_id: string
        tweet_id: string
        tweet_type: TweetType
        page: number
        limit: number
    }) {
        const tweets = await databaseService.tweets
            .aggregate([
                {
                    $match: {
                        parent_id: new ObjectId(tweet_id),
                        type: tweet_type
                    }
                },
                {
                    $lookup: {
                        from: 'hashtags',
                        localField: 'hashtags',
                        foreignField: '_id',
                        as: 'hashtags'
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'mentions',
                        foreignField: '_id',
                        as: 'mentions'
                    }
                },
                {
                    $addFields: {
                        mentions: {
                            $map: {
                                input: '$mentions',
                                as: 'mention',
                                in: {
                                    _id: '$$mention._id',
                                    name: '$$mention.name'
                                }
                            }
                        }
                    }
                },
                {
                    $lookup: {
                        from: 'bookmarks',
                        localField: '_id',
                        foreignField: 'tweet_id',
                        as: 'bookmarks'
                    }
                },
                {
                    $lookup: {
                        from: 'likes',
                        localField: '_id',
                        foreignField: 'tweet_id',
                        as: 'likes'
                    }
                },
                {
                    $lookup: {
                        from: 'tweets',
                        localField: '_id',
                        foreignField: 'parent_id',
                        as: 'tweet_children'
                    }
                },
                {
                    $addFields: {
                        bookmarks: {
                            $size: '$bookmarks'
                        },
                        likes: {
                            $size: '$likes'
                        },
                        retweet_count: {
                            $size: {
                                $filter: {
                                    input: '$tweet_children',
                                    as: 'item',
                                    cond: {
                                        $eq: ['$$item.type', TweetType.Retweet]
                                    }
                                }
                            }
                        },
                        comment_count: {
                            $size: {
                                $filter: {
                                    input: '$tweet_children',
                                    as: 'item',
                                    cond: {
                                        $eq: ['$$item.type', TweetType.Comment]
                                    }
                                }
                            }
                        },
                        quote_count: {
                            $size: {
                                $filter: {
                                    input: '$tweet_children',
                                    as: 'item',
                                    cond: {
                                        $eq: ['$$item.type', TweetType.QuoteTweet]
                                    }
                                }
                            }
                        }
                    }
                },
                {
                    $project: {
                        tweet_children: 0
                    }
                },
                {
                    $skip: (page - 1) * limit
                },
                {
                    $limit: limit
                }
            ])
            .toArray()
        const ids = tweets.map((tweet) => tweet._id as ObjectId)
        const inc = user_id ? { user_views: 1 } : { guest_views: 1 }
        const date = new Date()
        const [totalItems] = await Promise.all([
            databaseService.tweets.countDocuments({
                parent_id: new ObjectId(tweet_id),
                type: tweet_type
            }),
            databaseService.tweets.updateMany(
                { _id: { $in: ids } },
                {
                    $inc: inc,
                    $set: {
                        updated_at: date
                    }
                }
            )
        ])
        // update views and updated_at after getting tweets
        tweets.forEach((tweet) => {
            tweet.updated_at = date
            if (user_id) {
                tweet.user_views += 1
            } else {
                tweet.guest_views += 1
            }
        })
        return {
            tweets,
            totalItems
        }
    }
}

const tweetsService = new TweetsService()
export default tweetsService
