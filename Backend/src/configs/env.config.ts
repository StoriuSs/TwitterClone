import { config } from 'dotenv'

config({ path: '.env' })

export const {
    NODE_ENV,
    PORT,
    MONGODB_URI,
    JWT_SECRET_KEY,
    JWT_ACCESS_TOKEN_EXPIRATION,
    JWT_REFRESH_TOKEN_EXPIRATION
} = process.env
