import { ObjectId } from 'mongodb'
import { TweetType, SearchType, SearchSource } from '~/constants/enum'
import databaseService from './database.services'

class SearchService {
    async search({
        content,
        limit,
        page,
        user_id,
        type,
        source
    }: {
        content: string
        limit: number
        page: number
        user_id: string
        type?: SearchType
        source?: SearchSource
    }) {
        // Default values for type and source
        const searchType = typeof type === 'number' ? type : SearchType.Top
        const searchSource = typeof source === 'number' ? source : SearchSource.Anyone

        // If searching for people
        if (searchType === SearchType.People) {
            // If following, get followed user ids
            let followedIds: ObjectId[] = []
            if (searchSource === SearchSource.Following) {
                const followed = await databaseService.followers
                    .find({ user_id: new ObjectId(user_id) }, { projection: { followed_user_id: 1 } })
                    .toArray()
                followedIds = followed.map((f) => f.followed_user_id)
            }
            const userMatch: any = {
                $or: [
                    { name: { $regex: content, $options: 'i' } },
                    { username: { $regex: content, $options: 'i' } },
                    { bio: { $regex: content, $options: 'i' } }
                ]
            }
            if (searchSource === SearchSource.Following) {
                userMatch._id = { $in: followedIds }
            }
            const users = await databaseService.users
                .aggregate([
                    { $match: userMatch },
                    { $skip: (page - 1) * limit },
                    { $limit: limit },
                    { $project: { password: 0, email_verify_token: 0, forgot_password_token: 0 } }
                ])
                .toArray()
            const totalItems = await databaseService.users.countDocuments(userMatch)
            return { users, totalItems }
        }

        // Tweet search
        const match: any = {}
        if (content && content.trim() !== '') {
            match.$text = { $search: content }
        }

        if (searchSource === SearchSource.Following) {
            const followed = await databaseService.followers
                .find({ user_id: new ObjectId(user_id) }, { projection: { followed_user_id: 1 } })
                .toArray()
            const ids = followed.map((f) => f.followed_user_id)
            ids.push(new ObjectId(user_id))
            match.user_id = { $in: ids }
        }
        // Only public or circle tweets user can see
        const audienceMatch = {
            $or: [
                { audience: 0 },
                {
                    $and: [{ audience: 1 }, { 'user.twitter_circle': { $in: [new ObjectId(user_id)] } }]
                }
            ]
        }

        const pipeline: any[] = [
            { $match: match },
            {
                $lookup: {
                    from: 'users',
                    localField: 'user_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            { $unwind: { path: '$user' } },
            { $match: audienceMatch }
        ]
        // Media filter
        if (searchType === SearchType.Media) {
            pipeline.push({ $match: { medias: { $exists: true, $not: { $size: 0 } } } })
        }
        // Sorting
        if (searchType === SearchType.Latest) {
            pipeline.push({ $sort: { created_at: -1 } })
        } else if (searchType === SearchType.Top) {
            pipeline.push({
                $addFields: {
                    engagement_score: {
                        $add: [
                            { $size: { $ifNull: ['$likes', []] } },
                            { $ifNull: ['$retweet_count', 0] },
                            { $ifNull: ['$comment_count', 0] },
                            { $ifNull: ['$quote_count', 0] },
                            { $size: { $ifNull: ['$bookmarks', []] } },
                            { $ifNull: ['$user_views', 0] },
                            { $ifNull: ['$guest_views', 0] }
                        ]
                    }
                }
            })
            pipeline.push({ $sort: { engagement_score: -1, created_at: -1 } })
        }
        // Pagination
        pipeline.push({ $skip: (page - 1) * limit }, { $limit: limit })
        // Enrichments
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
                            in: { _id: '$$mention._id', name: '$$mention.name' }
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
            // Use a simple engagement_score system to rank tweets when searching for Top tweets
            ...(searchType === SearchType.Top
                ? [
                      {
                          $addFields: {
                              engagement_score: {
                                  $add: [
                                      { $ifNull: ['$likes', 0] },
                                      { $ifNull: ['$retweet_count', 0] },
                                      { $ifNull: ['$comment_count', 0] },
                                      { $ifNull: ['$quote_count', 0] },
                                      { $ifNull: ['$bookmarks', 0] },
                                      { $ifNull: ['$user_views', 0] },
                                      { $ifNull: ['$guest_views', 0] }
                                  ]
                              }
                          }
                      },
                      { $sort: { engagement_score: -1, created_at: -1 } }
                  ]
                : []),
            // Pagination
            { $skip: (page - 1) * limit },
            { $limit: limit },
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
        // push $count stage before pagination to count total items
        const countPipeline = pipeline.slice(
            0,
            pipeline.findIndex((stage) => stage.$skip !== undefined)
        )
        countPipeline.push({ $count: 'totalItems' })
        const totalItemsResult = await databaseService.tweets.aggregate(countPipeline).toArray()
        const totalItems = totalItemsResult.length > 0 ? totalItemsResult[0].totalItems : 0
        return { tweets, totalItems }
    }
}

const searchService = new SearchService()
export default searchService
