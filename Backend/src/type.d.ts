import { TokenPayload } from './models/requests/User.requests'
import User from './models/schemas/User.schema'

declare module 'express' {
    export interface Request {
        user?: User
        decoded_authorization?: TokenPayload
        decoded_refresh_token?: TokenPayload
        decoded_email_verify_token?: TokenPayload
    }
}
