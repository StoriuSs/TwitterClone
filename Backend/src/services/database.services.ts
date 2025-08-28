import { Collection, Db, MongoClient, ServerApiVersion } from 'mongodb'
import { MONGODB_URI } from '../configs/env.config'
import User from '../models/schemas/User.schema'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import Follower from '~/models/schemas/Follower.schema'
import VideoStatus from '~/models/schemas/VideoStatus.schema'
import Tweet from '~/models/schemas/Tweet.schema'
import Hashtag from '~/models/schemas/Hashtag.schema'

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
}

const databaseService = new DatabaseService(uri as string)
export default databaseService
