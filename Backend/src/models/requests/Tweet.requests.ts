import { ParamsDictionary, Query } from 'express-serve-static-core'
import { NewsFeedType, TweetAudience, TweetType } from '~/constants/enum'
import { Media } from '../schemas/Media.schema'

export interface TweetReqBody {
    type: TweetType
    audience: TweetAudience
    content: string
    parent_id: string | null
    hashtags: string[]
    mentions: string[]
    medias: Media[]
}

export interface TweetParam extends ParamsDictionary {
    tweet_id: string
}

export interface Pagination {
    page: string
    limit: string
}
export interface TweetQuery extends Query, Pagination {
    tweet_type: string
}

export interface NewsFeedQuery extends Pagination {
    source: NewsFeedType
}
