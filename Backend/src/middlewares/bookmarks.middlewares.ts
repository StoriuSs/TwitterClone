import { checkSchema } from 'express-validator'
import { ObjectId } from 'mongodb'
import { tweetMessages } from '~/constants/messages'
import databaseService from '~/services/database.services'
import { validate } from '~/utils/validation'

export const createBookmarkValidator = validate(
    checkSchema({
        tweet_id: {
            in: ['body'],
            notEmpty: {
                errorMessage: tweetMessages.tweetIdIsRequired
            },
            isMongoId: {
                errorMessage: tweetMessages.tweetIdMustBeMongoId
            },
            custom: {
                options: async (value, { req }) => {
                    // check if the user already bookmarked the tweet
                    const user_id = req.decoded_authorization.user_id
                    const bookmark = await databaseService.bookmarks.findOne({
                        user_id: new ObjectId(user_id),
                        tweet_id: new ObjectId(value)
                    })
                    if (bookmark) {
                        throw new Error(tweetMessages.tweetAlreadyBookmarked)
                    }
                    return true
                }
            }
        }
    })
)

export const deleteBookmarkValidator = validate(
    checkSchema({
        tweet_id: {
            in: ['params'],
            notEmpty: {
                errorMessage: tweetMessages.tweetIdIsRequired
            },
            isMongoId: {
                errorMessage: tweetMessages.tweetIdMustBeMongoId
            },
            custom: {
                options: async (value, { req }) => {
                    // check if the user already bookmarked the tweet
                    const user_id = req.decoded_authorization.user_id
                    const bookmark = await databaseService.bookmarks.findOne({
                        user_id: new ObjectId(user_id),
                        tweet_id: new ObjectId(value)
                    })
                    if (!bookmark) {
                        throw new Error(tweetMessages.tweetNotBookmarked)
                    }
                    return true
                }
            }
        }
    })
)
