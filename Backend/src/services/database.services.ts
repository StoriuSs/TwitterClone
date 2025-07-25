import { Collection, Db, MongoClient, ServerApiVersion } from 'mongodb'
import { MONGODB_URI } from '../configs/env.config'
import User from '../models/schemas/User.schema'
import RefreshToken from '~/models/schemas/RefreshToken.schema'

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

    get users(): Collection<User> {
        return this.db.collection('users')
    }

    get refreshTokens(): Collection<RefreshToken> {
        return this.db.collection('refresh_tokens')
    }
}

const databaseService = new DatabaseService(uri as string)
export default databaseService
