import { checkSchema } from 'express-validator'
import httpStatus from '~/constants/httpStatus'
import { userMessages } from '~/constants/messages'
import { ErrorsWithStatus } from '~/models/Errors'
import databaseService from '~/services/database.services'
import usersService from '~/services/users.services'
import { validate } from '~/utils/validation'
import { comparePasswords } from '~/utils/hash'
import { verifyToken } from '~/utils/jwt'
import { Request } from 'express'

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

export const loginValidator = validate(
    checkSchema({
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
                options: async (value, { req }) => {
                    const user = await databaseService.users.findOne({
                        email: value
                    })
                    // If user is not found, throw an error
                    if (user === null) {
                        throw new ErrorsWithStatus(userMessages.userNotFound, httpStatus.UNPROCESSABLE_ENTITY)
                    }
                    // If password does not match, throw an error
                    const isMatch = await comparePasswords(req.body.password, user.password)
                    if (isMatch === false) {
                        throw new ErrorsWithStatus(userMessages.passwordIncorrect, httpStatus.UNPROCESSABLE_ENTITY)
                    }
                    // If user is valid, attach user to request object
                    req.user = user
                    return true
                }
            }
        },
        password: {
            in: ['body'],
            notEmpty: {
                errorMessage: userMessages.passwordIsRequired
            },
            isString: {
                errorMessage: userMessages.passwordMustBeString
            }
        }
    })
)

export const accessTokenValidator = validate(
    checkSchema({
        Authorization: {
            in: ['headers'],
            notEmpty: {
                errorMessage: userMessages.accessTokenRequired
            },
            isString: {
                errorMessage: userMessages.accessTokenMustBeString
            },
            trim: true,
            custom: {
                options: async (value: string, { req }) => {
                    const access_token = value.split(' ')[1] || ''
                    if (access_token === '') {
                        throw new ErrorsWithStatus(userMessages.accessTokenRequired, httpStatus.UNAUTHORIZED)
                    }

                    const decoded_authorization = await verifyToken(access_token)
                    req.decoded_authorization = decoded_authorization
                    return true
                }
            }
        }
    })
)

export const refreshTokenValidator = validate(
    checkSchema({
        refresh_token: {
            in: ['cookies'],
            notEmpty: {
                errorMessage: userMessages.refreshTokenRequired
            },
            isString: {
                errorMessage: userMessages.refreshTokenMustBeString
            },
            trim: true,
            custom: {
                options: async (value: string, { req }) => {
                    if (value === '') {
                        throw new ErrorsWithStatus(userMessages.refreshTokenRequired, httpStatus.UNAUTHORIZED)
                    }
                    console.log(value)
                    const refresh_token = await databaseService.refreshTokens.findOne({ token: value })
                    console.log(refresh_token)
                    if (refresh_token === null) {
                        throw new ErrorsWithStatus(userMessages.refreshTokenInvalid, httpStatus.UNAUTHORIZED)
                    }

                    const decoded_refresh_token = await verifyToken(value)
                    ;(req as Request).decoded_refresh_token = decoded_refresh_token
                    return true
                }
            }
        }
    })
)
