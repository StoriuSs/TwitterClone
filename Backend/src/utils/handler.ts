import { Request, Response, NextFunction, RequestHandler } from 'express'

// Use this func to wrap request handlers and catch errors, it helps in avoiding try-catch in every controller
export const wrapRequestHandler = (func: RequestHandler) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            await func(req, res, next)
        } catch (error: any) {
            next(error)
        }
    }
}
