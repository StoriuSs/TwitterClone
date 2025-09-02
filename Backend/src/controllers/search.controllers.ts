import { ParamsDictionary } from 'express-serve-static-core'
import { Request, Response } from 'express'
import { SearchQuery } from '~/models/requests/Search.requests'
import searchService from '~/services/search.services'
import { SearchType } from '~/constants/enum'

export const searchController = async (req: Request<ParamsDictionary, any, any, SearchQuery>, res: Response) => {
    const content = req.query.content
    const limit = Number(req.query.limit)
    const page = Number(req.query.page)
    const user_id = req.decoded_authorization?.user_id as string
    const type = Number(req.query.type) || undefined
    const source = Number(req.query.source) || undefined

    const result = await searchService.search({ content, limit, page, user_id, type, source })
    return res.json({
        message: 'Search results',
        page: page,
        total_pages: Math.ceil(result.totalItems / limit),
        limit: limit,
        ...(type == SearchType.People ? { users: result.users } : { tweets: result.tweets })
    })
}
