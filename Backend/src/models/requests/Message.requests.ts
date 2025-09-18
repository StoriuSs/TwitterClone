import { ParamsDictionary } from 'express-serve-static-core'

export interface MessageRequestParams extends ParamsDictionary {
    recipientId: string
}
