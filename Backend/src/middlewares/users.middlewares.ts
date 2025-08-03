import { checkSchema, ParamSchema } from 'express-validator'
import httpStatus from '~/constants/httpStatus'
import { userMessages } from '~/constants/messages'
import { ErrorsWithStatus } from '~/models/Errors'
import databaseService from '~/services/database.services'
import usersService from '~/services/users.services'
import { validate } from '~/utils/validation'
import { comparePasswords } from '~/utils/hash'
import { verifyToken } from '~/utils/jwt'
import { NextFunction, Request, Response } from 'express'
import { JWT_ACCESS_TOKEN_SECRET_KEY, JWT_REFRESH_TOKEN_SECRET_KEY } from '~/configs/env.config'
import { UserVerifyStatus } from '~/constants/enum'
import { TokenPayload } from '~/models/requests/User.requests'
import { ObjectId } from 'mongodb'

const nameSchema: ParamSchema = {
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
    trim: true
}

const dateOfBirthSchema: ParamSchema = {
    in: ['body'],
    isISO8601: {
        options: { strict: true, strictSeparator: true },
        errorMessage: userMessages.dayOfBirthMustBeISO8601
    }
}

const passwordSchema: ParamSchema = {
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
}

const confirmPasswordSchema: ParamSchema = {
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
}

export const registerValidator = validate(
    checkSchema({
        name: nameSchema,
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
        password: passwordSchema,
        confirm_password: confirmPasswordSchema,
        date_of_birth: dateOfBirthSchema
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

                    const decoded_authorization = await verifyToken(access_token, JWT_ACCESS_TOKEN_SECRET_KEY as string)
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
                    const refresh_token = await databaseService.refreshTokens.findOne({ token: value })
                    if (refresh_token === null) {
                        throw new ErrorsWithStatus(userMessages.refreshTokenInvalid, httpStatus.UNAUTHORIZED)
                    }

                    const decoded_refresh_token = await verifyToken(value, JWT_REFRESH_TOKEN_SECRET_KEY as string)
                    ;(req as Request).decoded_refresh_token = decoded_refresh_token
                    return true
                }
            }
        }
    })
)

export const emailVerifyTokenValidator = validate(
    checkSchema({
        token: {
            in: ['params'],
            notEmpty: {
                errorMessage: userMessages.emailVerifyTokenRequired
            },
            isString: {
                errorMessage: userMessages.emailVerifyTokenMustBeString
            },
            trim: true,
            custom: {
                options: async (value: string, { req }) => {
                    if (value === '') {
                        throw new ErrorsWithStatus(userMessages.emailVerifyTokenRequired, httpStatus.UNAUTHORIZED)
                    }
                    // Find user by token
                    const user = await databaseService.users.findOne({ email_verify_token: value })
                    if (!user) {
                        throw new ErrorsWithStatus(userMessages.emailVerifyTokenInvalid, httpStatus.UNAUTHORIZED)
                    }
                    if (user.verify === UserVerifyStatus.Verified) {
                        throw new ErrorsWithStatus(userMessages.emailAlreadyVerified, httpStatus.UNPROCESSABLE_ENTITY)
                    }
                    req.user = user
                    return true
                }
            }
        }
    })
)

export const forgotPasswordValidator = validate(
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
                    const user = await databaseService.users.findOne({ email: value })
                    if (!user) {
                        throw new ErrorsWithStatus(userMessages.userNotFound, httpStatus.UNPROCESSABLE_ENTITY)
                    }
                    req.user = user
                    return true
                }
            }
        }
    })
)

export const verifyForgotPasswordTokenValidator = validate(
    checkSchema({
        token: {
            in: ['params'],
            notEmpty: {
                errorMessage: userMessages.forgotPasswordTokenRequired
            },
            isString: {
                errorMessage: userMessages.forgotPasswordTokenMustBeString
            },
            trim: true,
            custom: {
                options: async (value, { req }) => {
                    if (value === '') {
                        throw new ErrorsWithStatus(userMessages.forgotPasswordTokenRequired, httpStatus.UNAUTHORIZED)
                    }
                    const user = await databaseService.users.findOne({ forgot_password_token: value })
                    if (!user) {
                        throw new ErrorsWithStatus(userMessages.forgotPasswordTokenInvalid, httpStatus.UNAUTHORIZED)
                    }
                    req.user = user
                    return true
                }
            }
        }
    })
)

export const resetPasswordValidator = validate(
    checkSchema({
        password: passwordSchema,
        confirm_password: confirmPasswordSchema,
        forgot_password_token: {
            in: ['body'],
            notEmpty: {
                errorMessage: userMessages.forgotPasswordTokenRequired
            },
            isString: {
                errorMessage: userMessages.forgotPasswordTokenMustBeString
            },
            trim: true,
            custom: {
                options: async (value, { req }) => {
                    if (value === '') {
                        throw new ErrorsWithStatus(userMessages.forgotPasswordTokenRequired, httpStatus.UNAUTHORIZED)
                    }
                    const user = await databaseService.users.findOne({ forgot_password_token: value })
                    if (!user) {
                        throw new ErrorsWithStatus(userMessages.forgotPasswordTokenInvalid, httpStatus.UNAUTHORIZED)
                    }
                    req.user = user
                    return true
                }
            }
        }
    })
)

export const updateAboutMeValidator = validate(
    checkSchema({
        name: {
            ...nameSchema,
            optional: true,
            notEmpty: undefined
        },
        date_of_birth: {
            ...dateOfBirthSchema,
            optional: true
        },
        bio: {
            in: ['body'],
            isString: {
                errorMessage: userMessages.bioMustBeString
            },
            isLength: {
                options: { max: 500 },
                errorMessage: userMessages.bioLength
            },
            optional: true,
            trim: true
        },
        location: {
            in: ['body'],
            isString: {
                errorMessage: userMessages.locationMustBeString
            },
            isLength: {
                options: { max: 100 },
                errorMessage: userMessages.locationLength
            },
            optional: true,
            trim: true
        },
        website: {
            in: ['body'],
            isURL: {
                errorMessage: userMessages.websiteMustBeValid
            },
            optional: true,
            trim: true
        },
        username: {
            in: ['body'],
            isString: {
                errorMessage: userMessages.usernameMustBeString
            },
            isLength: {
                options: { min: 1, max: 40 },
                errorMessage: userMessages.usernameLength
            },
            optional: true,
            trim: true,
            custom: {
                options: async (value, { req }) => {
                    if (value) {
                        const user = await databaseService.users.findOne({ username: value })
                        if (user && user._id.toString() !== req.user._id.toString()) {
                            throw new ErrorsWithStatus('Username already exists', httpStatus.UNPROCESSABLE_ENTITY)
                        }
                    }
                    return true
                }
            }
        },
        avatar: {
            in: ['body'],
            isString: {
                errorMessage: userMessages.avatarURLMustBeString
            },
            optional: true,
            trim: true
        },
        cover_photo: {
            in: ['body'],
            isString: {
                errorMessage: userMessages.coverPhotoMustBeString
            },
            optional: true,
            trim: true
        }
    })
)

export const followValidator = validate(
    checkSchema({
        followed_user_id: {
            in: ['body'],
            trim: true,
            notEmpty: {
                errorMessage: userMessages.followUserIdRequired
            },
            custom: {
                options: async (value, { req }) => {
                    if (value === req.decoded_authorization.user_id) {
                        throw new ErrorsWithStatus(userMessages.cannotFollowYourself, httpStatus.BAD_REQUEST)
                    }
                    const followedUser = await databaseService.users.findOne({ _id: new ObjectId(value) })
                    if (!followedUser) {
                        throw new ErrorsWithStatus(userMessages.userNotFound, httpStatus.NOT_FOUND)
                    }
                    return true
                }
            }
        }
    })
)

export const verifiedUserValidator = (req: Request, res: Response, next: NextFunction) => {
    const { verify } = req.decoded_authorization as TokenPayload
    if (verify !== UserVerifyStatus.Verified) {
        // If user is not verified, throw an error to the error handler
        return next(new ErrorsWithStatus(userMessages.userNotVerified, httpStatus.FORBIDDEN))
    }
    next()
}
