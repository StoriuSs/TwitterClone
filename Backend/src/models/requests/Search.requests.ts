import { Pagination } from './Tweet.requests'
import { SearchType, SearchSource } from '~/constants/enum'

export interface SearchQuery extends Pagination {
    content: string
    type?: SearchType
    source?: SearchSource
}
