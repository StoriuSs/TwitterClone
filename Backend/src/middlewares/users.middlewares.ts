import { checkSchema } from 'express-validator'
import httpStatus from '~/constants/httpStatus'
import { userMessages } from '~/constants/messages'
import { ErrorsWithStatus } from '~/models/Errors'
import usersService from '~/services/users.services'
import { validate } from '~/utils/validation'

export const registerValidator = validate(
    checkSchema({
        name: {
            in: ['body'],
            notEmpty: {
                errorMessage: userMessages.nameIsRequired
            },
            isString: {
                errorMessage: userMessages.nameMustBeString
            },
            isLength: {
                options: { min: 2, max: 100 },
                errorMessage: userMessages.nameLength
            },
            optional: true,
            trim: true
        },
        email: {
            in: ['body'],
            notEmpty: {
                errorMessage: userMessages.emailIsRequired
            },
            isEmail: {
                errorMessage: userMessages.emailInvalid
            },
            normalizeEmail: true,
            trim: true,
            custom: {
                options: async (value) => {
                    const userExists = await usersService.emailExists(value)
                    if (userExists) {
                        throw new ErrorsWithStatus(userMessages.emailAlreadyExists, httpStatus.UNPROCESSABLE_ENTITY)
                    }
                    return true
                }
            }
        },
        password: {
            in: ['body'],
            isString: {
                errorMessage: userMessages.passwordMustBeString
            },
            isLength: {
                options: { min: 6, max: 60 },
                errorMessage: userMessages.passwordLength
            },
            isStrongPassword: {
                options: {
                    minLength: 6,
                    minLowercase: 1,
                    minUppercase: 1,
                    minNumbers: 1,
                    minSymbols: 1
                },
                errorMessage: userMessages.passwordStrong
            }
        },
        confirm_password: {
            in: ['body'],
            isString: {
                errorMessage: userMessages.confirmPasswordMustBeString
            },
            isLength: {
                options: { min: 6, max: 60 },
                errorMessage: userMessages.confirmPasswordLength
            },
            isStrongPassword: {
                options: {
                    minLength: 6,
                    minLowercase: 1,
                    minUppercase: 1,
                    minNumbers: 1,
                    minSymbols: 1
                },
                errorMessage: userMessages.confirmPasswordStrong
            },
            custom: {
                options: (value, { req }) => {
                    if (value !== req.body.password) {
                        throw new Error(userMessages.passwordsMustMatch)
                    }
                    return true
                }
            }
        },
        date_of_birth: {
            in: ['body'],
            isISO8601: {
                options: { strict: true, strictSeparator: true },
                errorMessage: userMessages.dayOfBirthMustBeISO8601
            }
        }
    })
)
