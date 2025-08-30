import { Request, Response, NextFunction, RequestHandler } from 'express'

// Use this func to wrap request handlers and catch errors, it helps in avoiding try-catch in every controller
export const wrapRequestHandler = <p>(func: RequestHandler<p, any, any, any>) => {
    return async (req: Request<p>, res: Response, next: NextFunction) => {
        try {
            await func(req, res, next)
        } catch (error: any) {
            next(error)
        }
    }
}
