import express from 'express'
import { ValidationChain, validationResult } from 'express-validator'
import { RunnableValidationChains } from 'express-validator/lib/middlewares/schema'
import httpStatus from '~/constants/httpStatus'
import { ErrorsWithStatus } from '~/models/Errors'

export const validate = (validation: RunnableValidationChains<ValidationChain>) => {
    return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        await validation.run(req)
        const errors = validationResult(req)
        const errorsObject = errors.mapped()
        // Handle normal errors that are not validation errors
        for (const key in errorsObject) {
            const { msg } = errorsObject[key]
            if (msg instanceof ErrorsWithStatus && msg.status !== httpStatus.UNPROCESSABLE_ENTITY) {
                return next(msg)
            }
        }
        // If there are no validation errors, proceed to the next middleware
        if (errors.isEmpty()) {
            return next()
        }
        // Handle validation errors
        res.status(httpStatus.UNPROCESSABLE_ENTITY).json({
            message: 'Validation failed',
            errors: errorsObject
        })
    }
}
