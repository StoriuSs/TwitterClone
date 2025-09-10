import type { TweetType } from './tweet.interface'

export interface UserProfile {
    _id: string
    name: string
    email: string
    username: string
    bio?: string
    location?: string
    website?: string
    avatar?: string
    cover_photo?: string
    date_of_birth?: string
    verify: number
    created_at?: string
    updated_at?: string
}

export interface ProfileState {
    profile: UserProfile | null
    userTweets: TweetType[]
    loading: boolean
    error: string | null
    isFollowing: boolean
    followersCount: number
    followingCount: number
    tweetsCount: number
}
