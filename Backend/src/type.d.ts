import User from './models/schemas/User.schema'

declare module 'express' {
    export interface Request {
        user?: User
    }
}
