import { TweetReqBody } from '~/models/requests/Tweet.requests'
import databaseService from './database.services'
import Tweet from '~/models/schemas/Tweet.schema'
import { ObjectId, WithId } from 'mongodb'
import Hashtag from '~/models/schemas/Hashtag.schema'

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
                    guest_views: 1
                }
            }
        )
        return result
    }
}

const tweetsService = new TweetsService()
export default tweetsService
