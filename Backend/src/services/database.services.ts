import { Collection, Db, MongoClient, ServerApiVersion } from 'mongodb'
import { MONGODB_URI } from '../configs/env.config'
import User from '../models/schemas/User.schema'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import Follower from '~/models/schemas/Follower.schema'
import VideoStatus from '~/models/schemas/VideoStatus.schema'
import Tweet from '~/models/schemas/Tweet.schema'
import Hashtag from '~/models/schemas/Hashtag.schema'
import Bookmark from '~/models/schemas/Bookmark.schema'
import Like from '~/models/schemas/Like.schema'
const uri = MONGODB_URI

class DatabaseService {
    private client: MongoClient
    private db: Db

    constructor(uri: string) {
        this.client = new MongoClient(uri, {
            serverApi: {
                version: ServerApiVersion.v1,
                strict: true,
                deprecationErrors: true
            }
        })
        this.db = this.client.db('twitter-backend')
    }

    async connect() {
        try {
            await this.client.connect()
            console.log('Connected to MongoDB')
        } catch (error) {
            console.error('Error connecting to MongoDB:', error)
        }
    }

    async close() {
        await this.client.close()
        console.log('MongoDB connection closed')
    }

    async indexUsers() {
        const alreadyExists = await this.users.indexExists(['email_1', 'username_1', 'email_1_password_1'])
        if (alreadyExists) return
        this.users.createIndex({ email: 1 }, { unique: true })
        this.users.createIndex({ username: 1 }, { unique: true })
        this.users.createIndex({ email: 1, password: 1 })
    }

    async indexRefreshTokens() {
        const alreadyExists = await this.refreshTokens.indexExists(['token_1', 'expires_at_1'])
        if (alreadyExists) return
        this.refreshTokens.createIndex({ token: 1 })
        this.refreshTokens.createIndex({ expires_at: 1 }, { expireAfterSeconds: 0 }) // MongoDb will automatically delete expired refresh tokens
    }

    async indexVideoStatuses() {
        const alreadyExists = await this.videoStatuses.indexExists(['name_1'])
        if (alreadyExists) return
        this.videoStatuses.createIndex({ name: 1 })
    }

    async indexFollowers() {
        const alreadyExists = await this.followers.indexExists('user_id_1_followed_user_id_1')
        if (alreadyExists) return
        this.followers.createIndex({ user_id: 1, followed_user_id: 1 })
    }

    async indexLikes() {
        const alreadyExists = await this.likes.indexExists('user_id_1_tweet_id_1')
        if (alreadyExists) return
        this.likes.createIndex({ user_id: 1, tweet_id: 1 })
    }

    async indexBookmarks() {
        const alreadyExists = await this.bookmarks.indexExists('user_id_1_tweet_id_1')
        if (alreadyExists) return
        this.bookmarks.createIndex({ user_id: 1, tweet_id: 1 })
    }

    async indexHashtags() {
        const alreadyExists = await this.hashtags.indexExists('name_1')
        if (alreadyExists) return
        this.hashtags.createIndex({ name: 1 }, { unique: true })
    }

    get users(): Collection<User> {
        return this.db.collection('users')
    }

    get refreshTokens(): Collection<RefreshToken> {
        return this.db.collection('refresh_tokens')
    }

    get followers(): Collection<Follower> {
        return this.db.collection('followers')
    }

    get videoStatuses(): Collection<VideoStatus> {
        return this.db.collection('video_statuses')
    }

    get tweets(): Collection<Tweet> {
        return this.db.collection('tweets')
    }

    get hashtags(): Collection<Hashtag> {
        return this.db.collection('hashtags')
    }

    get bookmarks(): Collection<Bookmark> {
        return this.db.collection('bookmarks')
    }

    get likes(): Collection<Like> {
        return this.db.collection('likes')
    }
}

const databaseService = new DatabaseService(uri as string)
export default databaseService
