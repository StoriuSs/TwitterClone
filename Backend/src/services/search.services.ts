import databaseService from './database.services'
import { ObjectId } from 'mongodb'
import { TweetType } from '~/constants/enum'

class SearchService {
    async search({ content, limit, page, user_id }: { content: string; limit: number; page: number; user_id: string }) {
        const data = await databaseService.tweets
            .aggregate([
                {
                    $match: {
                        $text: {
                            $search: content
                        }
                    }
                },
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
                },
                {
                    $match: {
                        $or: [
                            {
                                audience: 0
                            },
                            {
                                $and: [
                                    {
                                        audience: 1
                                    },
                                    {
                                        'user.twitter_circle': {
                                            $in: [new ObjectId(user_id)]
                                        }
                                    }
                                ]
                            }
                        ]
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
            ])
            .toArray()
        const totalItemsResult = await databaseService.tweets
            .aggregate([
                {
                    $match: {
                        $text: {
                            $search: content
                        }
                    }
                },
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
                },
                {
                    $match: {
                        $or: [
                            {
                                audience: 0
                            },
                            {
                                $and: [
                                    {
                                        audience: 1
                                    },
                                    {
                                        'user.twitter_circle': {
                                            $in: [new ObjectId(user_id)]
                                        }
                                    }
                                ]
                            }
                        ]
                    }
                },
                {
                    $count: 'totalItems'
                }
            ])
            .toArray()

        const totalItems = totalItemsResult.length > 0 ? totalItemsResult[0].totalItems : 0

        return {
            tweets: data,
            totalItems
        }
    }
}

const searchService = new SearchService()
export default searchService
