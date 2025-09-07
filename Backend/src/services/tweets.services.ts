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
            { _id: new ObjectId(tweet_id), deleted: false },
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
                        type: tweet_type,
                        deleted: false
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
                        let: { mentionIds: '$mentions' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: { $in: ['$_id', '$$mentionIds'] },
                                    deleted: false
                                }
                            }
                        ],
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
                        },
                        liked: {
                            $in: [new ObjectId(user_id), '$likes.user_id']
                        },
                        bookmarked: {
                            $in: [new ObjectId(user_id), '$bookmarks.user_id']
                        },
                        reposted: {
                            $cond: {
                                if: {
                                    $gt: [
                                        {
                                            $size: {
                                                $filter: {
                                                    input: '$tweet_children',
                                                    as: 'child',
                                                    cond: {
                                                        $and: [
                                                            { $eq: ['$$child.user_id', new ObjectId(user_id)] },
                                                            {
                                                                $in: [
                                                                    '$$child.type',
                                                                    [TweetType.Retweet, TweetType.QuoteTweet]
                                                                ]
                                                            }
                                                        ]
                                                    }
                                                }
                                            }
                                        },
                                        0
                                    ]
                                },
                                then: true,
                                else: false
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
                type: tweet_type,
                deleted: false
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

    async getNewsFeed({
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
        const user_id_obj = new ObjectId(user_id)

        if (source === NewsFeedType.Following) {
            // Only followed users (including self)
            const followed_user_ids = await databaseService.followers
                .find({ user_id: user_id_obj }, { projection: { followed_user_id: 1 } })
                .toArray()
            const ids = followed_user_ids.map((item) => item.followed_user_id)
            ids.push(user_id_obj)

            // Build pipeline for followed users
            const pipeline: any[] = [
                {
                    $match: {
                        user_id: { $in: ids },
                        type: { $in: [TweetType.Tweet, TweetType.QuoteTweet, TweetType.Retweet] },
                        deleted: false
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        let: { userId: '$user_id' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: { $eq: ['$_id', '$$userId'] },
                                    deleted: false
                                }
                            }
                        ],
                        as: 'user'
                    }
                },
                { $unwind: { path: '$user' } },
                {
                    $match: {
                        $or: [
                            { audience: 0 },
                            {
                                $and: [{ audience: 1 }, { 'user.twitter_circle': { $in: [user_id_obj] } }]
                            }
                        ]
                    }
                },
                { $sort: { created_at: -1 } }
            ]

            const totalItemsResult = await databaseService.tweets
                .aggregate([...pipeline, { $count: 'totalItems' }])
                .toArray()
            const totalItems = totalItemsResult.length > 0 ? totalItemsResult[0].totalItems : 0

            // Pagination
            pipeline.push({ $skip: (page - 1) * limit }, { $limit: limit })

            // Enrich with related data
            pipeline.push(
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
                        bookmarked: {
                            $in: [user_id_obj, '$bookmarks.user_id']
                        },
                        liked: {
                            $in: [user_id_obj, '$likes.user_id']
                        },
                        reposted: {
                            $cond: {
                                if: {
                                    $gt: [
                                        {
                                            $size: {
                                                $filter: {
                                                    input: '$tweet_children',
                                                    as: 'child',
                                                    cond: {
                                                        $and: [
                                                            { $eq: ['$$child.user_id', user_id_obj] },
                                                            {
                                                                $in: [
                                                                    '$$child.type',
                                                                    [TweetType.Retweet, TweetType.QuoteTweet]
                                                                ]
                                                            }
                                                        ]
                                                    }
                                                }
                                            }
                                        },
                                        0
                                    ]
                                },
                                then: true,
                                else: false
                            }
                        }
                    }
                },
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
                {
                    $project: {
                        tweet_children: 0,
                        user_id: 0,
                        user: {
                            email: 0,
                            password: 0,
                            email_verify_token: 0,
                            forgot_password_token: 0,
                            twitter_circle: 0,
                            date_of_birth: 0,
                            location: 0,
                            website: 0,
                            created_at: 0,
                            updated_at: 0,
                            cover_photo: 0
                        }
                    }
                }
            )

            const tweets = await databaseService.tweets.aggregate(pipeline).toArray()
            return { tweets, totalItems }
        } else {
            // For-You: prioritized fill
            const followed_user_ids = await databaseService.followers
                .find({ user_id: user_id_obj }, { projection: { followed_user_id: 1 } })
                .toArray()
            const followed_ids = followed_user_ids.map((item) => item.followed_user_id)
            followed_ids.push(user_id_obj)

            // Get all followed users' tweets (recent first)
            const followedPipeline: any[] = [
                {
                    $match: {
                        user_id: { $in: followed_ids },
                        type: { $in: [TweetType.Tweet, TweetType.QuoteTweet, TweetType.Retweet] },
                        deleted: false
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        let: { userId: '$user_id' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: { $eq: ['$_id', '$$userId'] },
                                    deleted: false
                                }
                            }
                        ],
                        as: 'user'
                    }
                },
                { $unwind: { path: '$user' } },
                {
                    $match: {
                        $or: [
                            { audience: 0 },
                            {
                                $and: [{ audience: 1 }, { 'user.twitter_circle': { $in: [user_id_obj] } }]
                            }
                        ]
                    }
                },
                { $sort: { created_at: -1 } }
            ]

            // Get all popular tweets from non-followed users
            const popularPipeline: any[] = [
                {
                    $match: {
                        user_id: { $nin: followed_ids },
                        type: { $in: [TweetType.Tweet, TweetType.QuoteTweet] },
                        deleted: false,
                        created_at: { $gte: new Date(Date.now() - 1000 * 24 * 60 * 60 * 1000) }
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        let: { userId: '$user_id' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: { $eq: ['$_id', '$$userId'] },
                                    deleted: false
                                }
                            }
                        ],
                        as: 'user'
                    }
                },
                { $unwind: { path: '$user' } },
                {
                    $match: {
                        $or: [
                            { audience: 0 },
                            {
                                $and: [{ audience: 1 }, { 'user.twitter_circle': { $in: [user_id_obj] } }]
                            }
                        ]
                    }
                },
                // Engagement score
                {
                    $lookup: {
                        from: 'likes',
                        localField: '_id',
                        foreignField: 'tweet_id',
                        as: 'likes_arr'
                    }
                },
                {
                    $lookup: {
                        from: 'tweets',
                        localField: '_id',
                        foreignField: 'parent_id',
                        as: 'children_arr'
                    }
                },
                {
                    $addFields: {
                        engagement_score: {
                            $add: [
                                { $size: '$likes_arr' },
                                {
                                    $size: {
                                        $filter: {
                                            input: '$children_arr',
                                            as: 'item',
                                            cond: { $eq: ['$$item.type', TweetType.Retweet] }
                                        }
                                    }
                                },
                                {
                                    $size: {
                                        $filter: {
                                            input: '$children_arr',
                                            as: 'item',
                                            cond: { $eq: ['$$item.type', TweetType.Comment] }
                                        }
                                    }
                                },
                                {
                                    $size: {
                                        $filter: {
                                            input: '$children_arr',
                                            as: 'item',
                                            cond: { $eq: ['$$item.type', TweetType.QuoteTweet] }
                                        }
                                    }
                                }
                            ]
                        }
                    }
                },
                { $sort: { engagement_score: -1, created_at: -1 } }
            ]

            // Count total items (all possible for-you tweets)
            const totalItemsResult = await databaseService.tweets
                .aggregate([
                    {
                        $match: {
                            $or: [{ user_id: { $in: followed_ids } }, { user_id: { $nin: followed_ids } }],
                            type: { $in: [TweetType.Tweet, TweetType.QuoteTweet, TweetType.Retweet] },
                            deleted: false
                        }
                    }
                ])
                .toArray()
            const totalItems = totalItemsResult.length

            // Get enough tweets to fill the page (overfetch to ensure we have enough)
            const [followedTweets, popularTweets] = await Promise.all([
                databaseService.tweets.aggregate([...followedPipeline, { $limit: limit * 3 }]).toArray(),
                databaseService.tweets.aggregate([...popularPipeline, { $limit: limit * 3 }]).toArray()
            ])

            // IMPORTANT: Always reserve 2 slots for popular tweets if they exist
            const minPopularTweets = Math.min(2, popularTweets.length)

            // For each page, skip the appropriate number of popular tweets (for pagination)
            const skipPopular = (page - 1) * minPopularTweets
            const pagePopularTweets = popularTweets.slice(skipPopular, skipPopular + minPopularTweets)

            // Use the rest of the slots for followed tweets
            const maxFollowedTweets = limit - pagePopularTweets.length
            const pageFollowedTweets = followedTweets.slice(0, maxFollowedTweets)

            // Combine followed and popular, with popular at the start
            let tweets = [...pagePopularTweets, ...pageFollowedTweets]

            // If we don't have enough tweets to fill the page, add more popular tweets
            if (tweets.length < limit) {
                const usedIds = new Set(tweets.map((t) => t._id.toString()))
                const additionalPopular = popularTweets
                    .filter((t) => !usedIds.has(t._id.toString()))
                    .slice(0, limit - tweets.length)
                tweets = [...tweets, ...additionalPopular]
            }

            // Still not full? Add more followed tweets (avoiding duplicates)
            if (tweets.length < limit) {
                const usedIds = new Set(tweets.map((t) => t._id.toString()))
                const additionalFollowed = followedTweets
                    .filter((t) => !usedIds.has(t._id.toString()))
                    .slice(pageFollowedTweets.length, pageFollowedTweets.length + (limit - tweets.length))
                tweets = [...tweets, ...additionalFollowed]
            }

            // Final slice to ensure we don't exceed the limit
            tweets = tweets.slice(0, limit)

            // If tweets is empty, return early
            if (tweets.length === 0) return { tweets: [], totalItems }

            const tweetIds = tweets.map((t) => t._id)
            const enrichPipeline: any[] = [
                { $match: { _id: { $in: tweetIds } } },
                {
                    $lookup: {
                        from: 'users',
                        let: { userId: '$user_id' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: { $eq: ['$_id', '$$userId'] },
                                    deleted: false
                                }
                            }
                        ],
                        as: 'user'
                    }
                },
                { $unwind: { path: '$user' } },
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
                        bookmarked: {
                            $in: [user_id_obj, '$bookmarks.user_id']
                        },
                        liked: {
                            $in: [user_id_obj, '$likes.user_id']
                        },
                        reposted: {
                            $cond: {
                                if: {
                                    $gt: [
                                        {
                                            $size: {
                                                $filter: {
                                                    input: '$tweet_children',
                                                    as: 'child',
                                                    cond: {
                                                        $and: [
                                                            { $eq: ['$$child.user_id', user_id_obj] },
                                                            {
                                                                $in: [
                                                                    '$$child.type',
                                                                    [TweetType.Retweet, TweetType.QuoteTweet]
                                                                ]
                                                            }
                                                        ]
                                                    }
                                                }
                                            }
                                        },
                                        0
                                    ]
                                },
                                then: true,
                                else: false
                            }
                        }
                    }
                },
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
                {
                    $project: {
                        tweet_children: 0,
                        user_id: 0,
                        user: {
                            email: 0,
                            password: 0,
                            email_verify_token: 0,
                            forgot_password_token: 0,
                            twitter_circle: 0,
                            date_of_birth: 0,
                            location: 0,
                            website: 0,
                            created_at: 0,
                            updated_at: 0,
                            cover_photo: 0
                        }
                    }
                }
            ]
            const enriched = await databaseService.tweets.aggregate(enrichPipeline).toArray()
            // Return in the same order as tweets
            const enrichedMap = new Map(enriched.map((t) => [t._id.toString(), t]))
            const ordered = tweetIds.map((id) => enrichedMap.get(id.toString())).filter(Boolean)
            return { tweets: ordered, totalItems }
        }
    }
}

const tweetsService = new TweetsService()
export default tweetsService
