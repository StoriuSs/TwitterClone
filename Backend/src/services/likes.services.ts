import databaseService from './database.services'
import { ObjectId } from 'mongodb'
import Like from '~/models/schemas/Like.schema'

class LikeService {
    async createLike(tweet_id: string, user_id: string) {
        await databaseService.likes.insertOne(
            new Like({
                user_id: new ObjectId(user_id),
                tweet_id: new ObjectId(tweet_id)
            })
        )
    }

    async removeLike(tweet_id: string, user_id: string) {
        await databaseService.likes.deleteOne({
            user_id: new ObjectId(user_id),
            tweet_id: new ObjectId(tweet_id)
        })
    }
}

const likesService = new LikeService()

export default likesService
