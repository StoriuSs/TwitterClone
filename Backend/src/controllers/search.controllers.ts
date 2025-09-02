import { ParamsDictionary } from 'express-serve-static-core'
import { Request, Response } from 'express'
import { SearchQuery } from '~/models/requests/Search.requests'
import searchService from '~/services/search.services'

export const searchController = async (req: Request<ParamsDictionary, any, any, SearchQuery>, res: Response) => {
    const content = req.query.content
    const limit = Number(req.query.limit)
    const page = Number(req.query.page)
    const user_id = req.decoded_authorization?.user_id as string
    const result = await searchService.search({ content, limit, page, user_id })
    return res.json({
        message: 'Search results',
        page: page,
        total_pages: Math.ceil(result.totalItems / limit),
        limit: limit,
        tweets: result.tweets
    })
}
