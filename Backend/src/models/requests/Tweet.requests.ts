import { ParamsDictionary, Query } from 'express-serve-static-core'
import { TweetAudience, TweetType } from '~/constants/enum'
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

export interface TweetQuery extends Query {
    page: string
    limit: string
    tweet_type: string
}
