import { TweetReqBody } from '~/models/requests/Tweet.requests'
import databaseService from './database.services'
import Tweet from '~/models/schemas/Tweet.schema'
import { ObjectId, WithId } from 'mongodb'
import Hashtag from '~/models/schemas/Hashtag.schema'
import { NewsFeedType, TweetType } from '~/constants/enum'

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
                    $skip: (page - 1) * limit
                },
                {
                    $limit: limit
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

    async getNewsFeedAdvanced({
        user_id,
        page,
        limit,
        source
    }: {
        user_id: string
        page: number
        limit: number
        source: NewsFeedType
    }) {
        console.log(source)
        const user_id_obj = new ObjectId(user_id)

        // Base aggregation pipeline
        const pipeline: any[] = []

        // Step 1: Determine which tweets to include based on source
        if (source === NewsFeedType.Following) {
            // Get followed user IDs
            const followed_user_ids = await databaseService.followers
                .find({ user_id: user_id_obj }, { projection: { followed_user_id: 1 } })
                .toArray()
            const ids = followed_user_ids.map((item) => item.followed_user_id)
            ids.push(user_id_obj) // include self id

            pipeline.push({
                $match: {
                    user_id: { $in: ids },
                    type: { $in: [TweetType.Tweet, TweetType.QuoteTweet, TweetType.Retweet] }
                }
            })
        } else {
            // "For You" algorithm - includes followed users' tweets + some popular tweets
            // Get followed user IDs
            const followed_user_ids = await databaseService.followers
                .find({ user_id: user_id_obj }, { projection: { followed_user_id: 1 } })
                .toArray()
            const followed_ids = followed_user_ids.map((item) => item.followed_user_id)
            followed_ids.push(user_id_obj) // include self id

            // Use $facet to combine two different tweet sources
            pipeline.push(
                {
                    $facet: {
                        followedTweets: [
                            {
                                $match: {
                                    user_id: { $in: followed_ids },
                                    type: { $in: [TweetType.Tweet, TweetType.QuoteTweet, TweetType.Retweet] },
                                    created_at: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
                                }
                            },
                            { $limit: Math.ceil(limit * 0.7) } // 70% from followed users
                        ],
                        popularTweets: [
                            {
                                $match: {
                                    user_id: { $nin: followed_ids }, // Exclude already followed users
                                    type: { $in: [TweetType.Tweet, TweetType.QuoteTweet] },
                                    created_at: { $gte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) } // Last 3 days
                                }
                            },
                            // Simple popularity metric: likes + retweets
                            {
                                $lookup: {
                                    from: 'likes',
                                    localField: '_id',
                                    foreignField: 'tweet_id',
                                    as: 'likes_array'
                                }
                            },
                            {
                                $lookup: {
                                    from: 'tweets',
                                    localField: '_id',
                                    foreignField: 'parent_id',
                                    as: 'retweets_array'
                                }
                            },
                            {
                                $addFields: {
                                    popularity_score: {
                                        $add: [
                                            { $size: '$likes_array' },
                                            {
                                                $size: {
                                                    $filter: {
                                                        input: '$retweets_array',
                                                        as: 'item',
                                                        cond: { $eq: ['$$item.type', TweetType.Retweet] }
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            },
                            { $sort: { popularity_score: -1 } },
                            { $limit: Math.ceil(limit * 0.3) } // 30% from popular tweets
                        ]
                    }
                },
                // Combine the results
                {
                    $project: {
                        tweets: { $concatArrays: ['$followedTweets', '$popularTweets'] }
                    }
                },
                { $unwind: '$tweets' },
                { $replaceRoot: { newRoot: '$tweets' } }
            )
        }

        // Step 2: Join with user collection
        pipeline.push(
            {
                $lookup: {
                    from: 'users',
                    localField: 'user_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $unwind: {
                    path: '$user'
                }
            }
        )

        // Step 3: Filter by audience
        pipeline.push({
            $match: {
                $or: [
                    { audience: 0 }, // Everyone
                    {
                        $and: [
                            { audience: 1 }, // Twitter Circle
                            { 'user.twitter_circle': { $in: [user_id_obj] } }
                        ]
                    }
                ]
            }
        })

        // Step 4: Sort by recency (most recent first)
        pipeline.push({ $sort: { created_at: -1 } })

        // Step 5: Pagination
        pipeline.push({ $skip: (page - 1) * limit }, { $limit: limit })

        // Step 6: Enrich with related data
        pipeline.push(
            // Hashtags
            {
                $lookup: {
                    from: 'hashtags',
                    localField: 'hashtags',
                    foreignField: '_id',
                    as: 'hashtags'
                }
            },
            // Mentions
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
            // Bookmarks
            {
                $lookup: {
                    from: 'bookmarks',
                    localField: '_id',
                    foreignField: 'tweet_id',
                    as: 'bookmarks'
                }
            },
            // Likes
            {
                $lookup: {
                    from: 'likes',
                    localField: '_id',
                    foreignField: 'tweet_id',
                    as: 'likes'
                }
            },
            // Has user bookmarked/liked
            {
                $addFields: {
                    bookmarked: {
                        $in: [user_id_obj, '$bookmarks.user_id']
                    },
                    liked: {
                        $in: [user_id_obj, '$likes.user_id']
                    }
                }
            },
            // Children tweets (for counts)
            {
                $lookup: {
                    from: 'tweets',
                    localField: '_id',
                    foreignField: 'parent_id',
                    as: 'tweet_children'
                }
            },
            // Add counts
            {
                $addFields: {
                    bookmarks: { $size: '$bookmarks' },
                    likes: { $size: '$likes' },
                    retweet_count: {
                        $size: {
                            $filter: {
                                input: '$tweet_children',
                                as: 'item',
                                cond: { $eq: ['$$item.type', TweetType.Retweet] }
                            }
                        }
                    },
                    comment_count: {
                        $size: {
                            $filter: {
                                input: '$tweet_children',
                                as: 'item',
                                cond: { $eq: ['$$item.type', TweetType.Comment] }
                            }
                        }
                    },
                    quote_count: {
                        $size: {
                            $filter: {
                                input: '$tweet_children',
                                as: 'item',
                                cond: { $eq: ['$$item.type', TweetType.QuoteTweet] }
                            }
                        }
                    }
                }
            },
            // Project final shape
            {
                $project: {
                    bookmarks: 1,
                    likes: 1,
                    bookmarked: 1,
                    liked: 1,
                    user: {
                        _id: 1,
                        name: 1,
                        username: 1,
                        avatar: 1,
                        verify: 1
                    }
                }
            }
        )

        // Execute aggregation pipeline
        const tweets = await databaseService.tweets.aggregate(pipeline).toArray()

        // Don't handle increasing views here, let client do that
        console.log(tweets.length)
        return tweets
    }
}

const tweetsService = new TweetsService()
export default tweetsService
