import databaseService from './database.services'
import { ObjectId } from 'mongodb'
import Bookmark from '~/models/schemas/Bookmark.schema'

class BookmarkService {
    async createBookmark(tweet_id: string, user_id: string) {
        await databaseService.bookmarks.insertOne(
            new Bookmark({
                user_id: new ObjectId(user_id),
                tweet_id: new ObjectId(tweet_id)
            })
        )
    }

    async removeBookmark(tweet_id: string, user_id: string) {
        await databaseService.bookmarks.deleteOne({
            user_id: new ObjectId(user_id),
            tweet_id: new ObjectId(tweet_id)
        })
    }
}

const bookmarksService = new BookmarkService()

export default bookmarksService
