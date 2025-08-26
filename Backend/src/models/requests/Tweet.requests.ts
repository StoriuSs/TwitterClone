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
