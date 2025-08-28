import { checkSchema } from 'express-validator'
import { ObjectId } from 'mongodb'
import { tweetMessages } from '~/constants/messages'
import databaseService from '~/services/database.services'
import { validate } from '~/utils/validation'

export const createLikeValidator = validate(
    checkSchema({
        tweet_id: {
            in: ['body'],
            custom: {
                options: async (value, { req }) => {
                    // check if the user already liked the tweet
                    const user_id = req.decoded_authorization.user_id
                    const like = await databaseService.likes.findOne({
                        user_id: new ObjectId(user_id),
                        tweet_id: new ObjectId(value)
                    })
                    if (like) {
                        throw new Error(tweetMessages.tweetAlreadyLiked)
                    }
                    return true
                }
            }
        }
    })
)

export const deleteLikeValidator = validate(
    checkSchema({
        tweet_id: {
            in: ['params'],
            custom: {
                options: async (value, { req }) => {
                    // check if the user already liked the tweet
                    const user_id = req.decoded_authorization.user_id
                    const like = await databaseService.likes.findOne({
                        user_id: new ObjectId(user_id),
                        tweet_id: new ObjectId(value)
                    })
                    if (!like) {
                        throw new Error(tweetMessages.tweetNotLiked)
                    }
                    return true
                }
            }
        }
    })
)
