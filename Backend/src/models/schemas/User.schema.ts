import { ObjectId } from 'mongodb'
import { UserVerifyStatus } from '~/constants/enum'

interface UserType {
    _id?: ObjectId
    name?: string
    email: string
    date_of_birth?: Date
    password: string
    created_at?: Date
    updated_at?: Date
    email_verify_token?: string // random token or empty string if email is verified
    forgot_password_token?: string // jwt or empty string if not requested
    verify?: UserVerifyStatus
    twitter_circle?: ObjectId[]

    bio?: string
    location?: string
    website?: string
    username?: string
    avatar?: string // URL to the avatar image
    cover_photo?: string // URL to the cover photo
    deleted?: boolean
}

export default class User {
    _id: ObjectId
    name: string
    email: string
    date_of_birth: Date
    password: string
    created_at: Date
    updated_at: Date
    email_verify_token: string
    forgot_password_token: string
    verify: UserVerifyStatus
    twitter_circle: ObjectId[]
    bio: string
    location: string
    website: string
    username: string
    avatar: string
    cover_photo: string
    deleted: boolean

    constructor({
        _id,
        name,
        email,
        date_of_birth,
        password,
        created_at,
        updated_at,
        email_verify_token,
        forgot_password_token,
        verify,
        twitter_circle,
        bio,
        location,
        website,
        username,
        avatar,
        cover_photo,
        deleted
    }: UserType) {
        this._id = _id || new ObjectId()
        this.name = name || ''
        this.email = email
        this.date_of_birth = date_of_birth || new Date()
        this.password = password
        this.created_at = created_at || new Date()
        this.updated_at = updated_at || new Date()
        this.email_verify_token = email_verify_token || ''
        this.forgot_password_token = forgot_password_token || ''
        this.verify = verify || UserVerifyStatus.Unverified
        this.twitter_circle = twitter_circle || []
        this.bio = bio || ''
        this.location = location || ''
        this.website = website || ''
        this.username = username || ''
        this.avatar = avatar || ''
        this.cover_photo = cover_photo || ''
        this.deleted = deleted || false
    }
}
