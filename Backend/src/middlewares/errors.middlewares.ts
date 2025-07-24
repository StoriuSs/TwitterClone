/* eslint-disable @typescript-eslint/no-unused-vars */
import { Request, Response, NextFunction } from 'express'
import { ErrorsWithStatus } from '~/models/Errors'

export const errorHandler = (err: ErrorsWithStatus, req: Request, res: Response, next: NextFunction) => {
    res.status(err.status || 500).json({
        message: err.message || 'Internal Server Error'
    })
}
