import { ObjectId } from 'mongodb'

interface MessageType {
    _id?: ObjectId
    from_user: ObjectId
    to_user: ObjectId
    content: string
    created_at?: Date
    updated_at?: Date
    read_at?: Date | null
}

export default class Message {
    _id: ObjectId
    from_user: ObjectId
    to_user: ObjectId
    content: string
    created_at: Date
    updated_at: Date
    read_at: Date | null

    constructor({ _id, from_user, to_user, content, created_at, updated_at, read_at }: MessageType) {
        this._id = _id || new ObjectId()
        this.from_user = from_user
        this.to_user = to_user
        this.content = content
        this.created_at = created_at || new Date()
        this.updated_at = updated_at || new Date()
        this.read_at = read_at || null
    }
}
