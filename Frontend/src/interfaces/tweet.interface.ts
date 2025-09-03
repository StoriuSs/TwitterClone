import type { UserType } from './auth.interface'

export interface TweetStats {
    replies: number
    retweets: number
    likes: number
    views: number
}

export interface TweetMedia {
    url: string
    type: 'image' | 'video'
}

export interface TweetType {
    _id: string
    content: string
    medias?: TweetMedia[]
    parent_id?: string
    user_id: string
    type?: number
    audience?: number
    hashtags?: string[]
    mentions?: string[]
    created_at: string
    updated_at: string
    guest_views: number
    user_views: number
    user?: UserType
    stats?: TweetStats
}

export interface NewTweetData {
    content: string
    medias?: string[]
    parent_id?: string
    type?: number
    audience?: number
    hashtags?: string[]
    mentions?: string[]
}

export interface TrendingTopic {
    id: string | number
    category: string
    title: string
    tweets: string
}

export interface FollowSuggestion {
    id: string | number
    name: string
    username: string
    avatar: string
}
