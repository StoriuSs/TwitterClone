import { checkSchema } from 'express-validator'
import { SearchType } from '~/constants/enum'
import { validate } from '~/utils/validation'

export const searchQueryValidator = validate(
    checkSchema({
        content: {
            in: ['query'],
            custom: {
                options: (value, { req }) => {
                    // Allow empty content only if type is Media
                    if (Number(req.query?.type) === SearchType.Media) {
                        return true
                    }
                    if (typeof value !== 'string' || value.trim() === '') {
                        throw new Error('Content is required')
                    }
                    return true
                }
            }
        },
        type: {
            in: ['query'],
            optional: true,
            toInt: true,
            isIn: {
                options: [[0, 1, 2, 3]],
                errorMessage: 'Invalid search type'
            }
        },
        source: {
            in: ['query'],
            optional: true,
            toInt: true,
            isIn: {
                options: [[0, 1]],
                errorMessage: 'Invalid search source'
            }
        },
        limit: {
            in: ['query'],
            optional: true,
            toInt: true,
            isInt: {
                options: { min: 1, max: 100 },
                errorMessage: 'Limit must be an integer between 1 and 100'
            }
        },
        page: {
            in: ['query'],
            optional: true,
            toInt: true,
            isInt: {
                options: { min: 1 },
                errorMessage: 'Page must be a positive integer'
            }
        }
    })
)
