import { ParamsDictionary } from 'express-serve-static-core'
import { Request, Response } from 'express'
import { TokenPayload } from '~/models/requests/User.requests'
import httpStatus from '~/constants/httpStatus'
import { BookmarkTweetReqBody } from '~/models/requests/Bookmark.requests'
import bookmarksService from '~/services/bookmarks.services'
import { tweetMessages } from '~/constants/messages'

export const createBookmarkController = async (
    req: Request<ParamsDictionary, any, BookmarkTweetReqBody>,
    res: Response
) => {
    const { user_id } = req.decoded_authorization as TokenPayload
    await bookmarksService.createBookmark(req.body.tweet_id, user_id)
    res.status(httpStatus.CREATED).json({
        message: tweetMessages.tweetBookmarked
    })
}

export const deleteBookmarkController = async (req: Request, res: Response) => {
    const { user_id } = req.decoded_authorization as TokenPayload
    await bookmarksService.removeBookmark(req.params.tweet_id, user_id)
    res.status(httpStatus.OK).json({
        message: tweetMessages.tweetUnbookmarked
    })
}
