import { JwtPayload } from 'jsonwebtoken'
import { UserVerifyStatus } from '~/constants/enum'

export interface RegisterReqBody {
    name: string
    email: string
    password: string
    confirm_password: string
    date_of_birth: string
    avatar?: string
    verify?: UserVerifyStatus
    username?: string
}

export interface LogoutReqBody {
    refresh_token: string
}
export interface TokenPayload extends JwtPayload {
    user_id: string
    token_type: string
    exp?: number
}

export interface ForgotPasswordReqBody {
    email: string
}

export interface UpdateAboutMeReqBody {
    name?: string
    date_of_birth?: string
    bio?: string
    location?: string
    website?: string
    username?: string
    avatar?: string
    cover_photo?: string
}
