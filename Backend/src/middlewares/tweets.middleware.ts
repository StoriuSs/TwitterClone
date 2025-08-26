import { checkSchema } from 'express-validator'
import { isEmpty } from 'lodash'
import { MediaType, TweetAudience, TweetType } from '~/constants/enum'
import { tweetMessages } from '~/constants/messages'
import { numberEnumToArray } from '~/utils/common'
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
                options: (value) => {
                    if (!isEmpty(value)) {
                        if (value.some((hashtag: any) => typeof hashtag !== 'string')) {
                            throw new Error(tweetMessages.hashtagsMustBeArrayOfStrings)
                        }
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
                options: (value) => {
                    if (!isEmpty(value)) {
                        if (value.some((mention: any) => typeof mention !== 'string')) {
                            throw new Error(tweetMessages.mentionsMustBeArrayOfStrings)
                        }
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
                options: (value) => {
                    if (!isEmpty(value)) {
                        if (
                            value.some((item: any) => {
                                return typeof item.url !== 'string' || !mediaTypes.includes(item.type)
                            })
                        ) {
                            throw new Error(tweetMessages.mediasMustBeArrayOfMediaTypes)
                        }
                    }
                    return true
                }
            }
        }
    })
)
