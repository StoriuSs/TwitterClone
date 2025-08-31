import { NextFunction, Request, Response } from 'express'
import { checkSchema } from 'express-validator'
import { isEmpty } from 'lodash'
import { ObjectId } from 'mongodb'
import { MediaType, TweetAudience, TweetType, UserVerifyStatus } from '~/constants/enum'
import httpStatus from '~/constants/httpStatus'
import { tweetMessages, userMessages } from '~/constants/messages'
import { ErrorsWithStatus } from '~/models/Errors'
import Tweet from '~/models/schemas/Tweet.schema'
import databaseService from '~/services/database.services'
import { numberEnumToArray } from '~/utils/common'
import { wrapRequestHandler } from '~/utils/handler'
import { validate } from '~/utils/validation'

const tweetTypes = numberEnumToArray(TweetType)
const tweetAudiences = numberEnumToArray(TweetAudience)
const mediaTypes = numberEnumToArray(MediaType)
export const createTweetValidator = validate(
    checkSchema({
        type: {
            in: ['body'],
            isIn: {
                options: [tweetTypes],
                errorMessage: tweetMessages.tweetTypeInvalid
            }
        },
        audience: {
            in: ['body'],
            isIn: {
                options: [tweetAudiences],
                errorMessage: tweetMessages.tweetAudienceInvalid
            }
        },
        content: {
            in: ['body'],
            isString: {
                errorMessage: tweetMessages.tweetContentMustBeString
            },
            custom: {
                options: (value, { req }) => {
                    const type = req.body.type
                    const hashtags = req.body.hashtags as string[]
                    const mentions = req.body.mentions as string[]
                    // if type is tweet, comment or quotetweet; AND there are no mentions, hastags, then content must not be empty
                    if (
                        [TweetType.Tweet, TweetType.Comment, TweetType.QuoteTweet].includes(type) &&
                        isEmpty(mentions) &&
                        isEmpty(hashtags) &&
                        value.trim() === ''
                    ) {
                        throw new Error(tweetMessages.tweetContentMustNotBeEmpty)
                    }

                    // if type is retweet, content must be empty
                    if (type === TweetType.Retweet && value.trim() !== '') {
                        throw new Error(tweetMessages.tweetContentMustBeEmpty)
                    }
                    return true
                }
            }
        },
        parent_id: {
            in: ['body'],
            custom: {
                options: (value, { req }) => {
                    const type = req.body.type
                    // if type is retweet, comment or quotetweet, 'parent_id' must be the parent's tweet_id
                    if ([TweetType.Retweet, TweetType.Comment, TweetType.QuoteTweet].includes(type) && !value) {
                        throw new Error(tweetMessages.tweetParentIdInvalid)
                    }
                    // if type is tweet, 'parent_id' must be null
                    if (type === TweetType.Tweet && value) {
                        throw new Error(tweetMessages.tweetParentIdMustBeNull)
                    }
                    return true
                }
            }
        },
        hashtags: {
            in: ['body'],
            isArray: {
                errorMessage: tweetMessages.hashtagsMustBeArrayOfStrings
            },
            custom: {
                options: (value, { req }) => {
                    if (!isEmpty(value)) {
                        if (value.some((hashtag: any) => typeof hashtag !== 'string')) {
                            throw new Error(tweetMessages.hashtagsMustBeArrayOfStrings)
                        }
                    }
                    // if the type is retweet, there should be no hashtags
                    if (req.body.type === TweetType.Retweet && !isEmpty(value)) {
                        throw new Error(tweetMessages.hashtagsMustBeEmpty)
                    }
                    return true
                }
            }
        },
        mentions: {
            in: ['body'],
            isArray: {
                errorMessage: tweetMessages.mentionsMustBeArrayOfStrings
            },
            custom: {
                options: (value, { req }) => {
                    if (!isEmpty(value)) {
                        if (value.some((mention: any) => typeof mention !== 'string')) {
                            throw new Error(tweetMessages.mentionsMustBeArrayOfStrings)
                        }
                    }
                    // if the type is retweet, there should be no mentions
                    if (req.body.type === TweetType.Retweet && !isEmpty(value)) {
                        throw new Error(tweetMessages.mentionsMustBeEmpty)
                    }
                    return true
                }
            }
        },
        medias: {
            in: ['body'],
            isArray: {
                errorMessage: tweetMessages.mediasMustBeArrayOfMediaTypes
            },
            custom: {
                options: (value, { req }) => {
                    if (!isEmpty(value)) {
                        if (
                            value.some((item: any) => {
                                return typeof item.url !== 'string' || !mediaTypes.includes(item.type)
                            })
                        ) {
                            throw new Error(tweetMessages.mediasMustBeArrayOfMediaTypes)
                        }
                    }
                    // if the type is retweet, there should be no medias
                    if (req.body.type === TweetType.Retweet && !isEmpty(value)) {
                        throw new Error(tweetMessages.mediasMustBeEmpty)
                    }
                    return true
                }
            }
        }
    })
)

export const getTweetByIdValidator = validate(
    checkSchema({
        tweet_id: {
            in: ['params', 'body'],
            notEmpty: {
                errorMessage: tweetMessages.tweetIdIsRequired
            },
            isMongoId: {
                errorMessage: tweetMessages.tweetIdMustBeMongoId
            },
            custom: {
                options: async (value, { req }) => {
                    const [tweet] = await databaseService.tweets
                        .aggregate<Tweet>([
                            {
                                $match: {
                                    _id: new ObjectId(value)
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
                            }
                        ])
                        .toArray()
                    if (!tweet) {
                        throw new Error(tweetMessages.tweetNotFound)
                    }
                    ;(req as Request).tweet = tweet
                    return true
                }
            }
        }
    })
)

export const getTweetChildrenValidator = validate(
    checkSchema({
        type: {
            in: ['query'],
            isIn: {
                options: [Object.values(TweetType)],
                errorMessage: tweetMessages.invalidTweetType
            }
        }
    })
)

export const paginationValidator = validate(
    checkSchema({
        page: {
            in: ['query'],
            isInt: {
                options: {
                    min: 1
                },
                errorMessage: tweetMessages.invalidPage
            },
            toInt: true
        },
        limit: {
            in: ['query'],
            isInt: {
                options: {
                    min: 1,
                    max: 100
                },
                errorMessage: tweetMessages.invalidLimit
            },
            toInt: true
        }
    })
)

export const audienceValidator = wrapRequestHandler(async (req: Request, res: Response, next: NextFunction) => {
    const tweet = req.tweet as Tweet
    if (tweet.audience === TweetAudience.TwitterCircle) {
        // check if the author's account is valid (not deleted, banned or private)
        const author = await databaseService.users.findOne({
            _id: new ObjectId(tweet.user_id)
        })
        if (!author || author.verify === UserVerifyStatus.Banned || author.verify === UserVerifyStatus.Private) {
            throw new ErrorsWithStatus(userMessages.userNotFound, httpStatus.NOT_FOUND)
        }

        // check if the user is in the author's Twitter Circle
        const authorTwitterCircle = author.twitter_circle
        const user = req.decoded_authorization // if the user is not logged in --> this would be undefined --> automatically fail the isInCircle check below
        const isInCircle = authorTwitterCircle.some((user_circle_id: ObjectId) =>
            new ObjectId(user_circle_id).equals(user?.user_id)
        )
        if (!isInCircle && !author._id.equals(user?.user_id)) {
            throw new ErrorsWithStatus(tweetMessages.tweetIsNotPublic, httpStatus.FORBIDDEN)
        }
    }
    next()
})
