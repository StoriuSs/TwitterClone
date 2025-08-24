import { ObjectId } from 'mongodb'

interface RefreshTokenType {
    _id?: ObjectId
    token: string
    created_at?: Date
    updated_at?: Date
    expires_at?: Date
    user_id: ObjectId
}

export default class RefreshToken {
    _id: ObjectId
    token: string
    created_at: Date
    updated_at: Date
    expires_at: Date
    user_id: ObjectId

    constructor({ _id, token, created_at, updated_at, expires_at, user_id }: RefreshTokenType) {
        this._id = _id || new ObjectId()
        this.token = token
        this.created_at = created_at || new Date()
        this.updated_at = updated_at || new Date()
        this.expires_at = expires_at || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Default to 7 days
        this.user_id = user_id
    }
}
