import { ObjectId } from 'mongodb'

interface RefreshTokenType {
    _id?: ObjectId
    token: string
    created_at?: Date
    updated_at?: Date
    user_id: ObjectId
}

export default class RefreshToken {
    _id: ObjectId
    token: string
    created_at: Date
    updated_at: Date
    user_id: ObjectId

    constructor({ _id, token, created_at, updated_at, user_id }: RefreshTokenType) {
        this._id = _id || new ObjectId()
        this.token = token
        this.created_at = created_at || new Date()
        this.updated_at = updated_at || new Date()
        this.user_id = user_id
    }
}
