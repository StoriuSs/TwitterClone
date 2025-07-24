import { hash } from 'bcrypt'

export const hashPassword = async (password: string) => {
    const saltRounds = 10
    return hash(password, saltRounds)
}
