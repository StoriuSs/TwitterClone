import { Request, Response, NextFunction } from 'express'
import { pick } from 'lodash'

export const filterDataFromBody = (allowedFields: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        // Filter the request body to only include allowed fields
        req.body = pick(req.body, allowedFields)
        next()
    }
}
