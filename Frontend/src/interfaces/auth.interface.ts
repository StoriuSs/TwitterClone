interface UserRegistrationDataType {
    name: string
    email: string
    password: string
    confirm_password: string
    date_of_birth: string
}

interface UserLoginDataType {
    email: string
    password: string
}

interface UserType {
    _id: string
    name: string
    email: string
    verify: number
    username?: string
    date_of_birth?: string
    bio?: string
    avatar?: string
    cover_photo?: string
    location?: string
    website?: string
}

interface AuthStateType {
    user: UserType | null
    accessToken: string | ''
    email_verify_token?: string | ''
    forgot_password_token?: string | ''
    isAuthenticated: boolean
    loading: boolean
    error: string | null
}

export type { UserRegistrationDataType, UserLoginDataType, UserType, AuthStateType }
