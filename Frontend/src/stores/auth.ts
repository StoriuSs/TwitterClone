import { defineStore } from 'pinia'
import api from '@/lib/api'
import {
    showSuccessToast,
    showErrorToast,
    extractSuccessMessage,
    extractErrorMessage as extractToastErrorMessage
} from '@/utils/toast'
import type {
    UserRegistrationDataType,
    UserLoginDataType,
    AuthStateType,
    UpdateProfileDataType
} from '@/interfaces/auth.interface'
import { extractErrorMessage } from '@/interfaces/error.interface'
import { useToast } from '@/composables/useToast'

export const useAuthStore = defineStore('auth', {
    state: (): AuthStateType => ({
        user: JSON.parse(localStorage.getItem('user') || 'null'),
        accessToken: localStorage.getItem('access_token') || '',
        email_verify_token: '',
        isAuthenticated: !!localStorage.getItem('access_token'),
        loading: false,
        error: null
    }),

    actions: {
        async register(userData: UserRegistrationDataType) {
            this.loading = true
            this.error = null

            try {
                const response = await api.post('/users/register', userData)

                const { access_token, email_verify_token } = response.data.result

                this.accessToken = access_token
                this.email_verify_token = email_verify_token
                this.isAuthenticated = true

                localStorage.setItem('access_token', access_token)
                localStorage.setItem('emailVerifyToken', email_verify_token)
                // Refresh token is automatically stored in HTTP-only cookie by the server

                await this.getUserInfo()

                // Show success toast
                showSuccessToast(extractSuccessMessage(response.data, 'Account created successfully!'))

                return {
                    success: true,
                    data: response.data
                }
            } catch (error) {
                console.error('Registration error:', error)

                // Use the utility function to extract the error message
                this.error = extractErrorMessage(error)

                // Show error toast
                showErrorToast(extractToastErrorMessage(error, 'Failed to create account'))

                return {
                    success: false,
                    error: this.error
                }
            } finally {
                this.loading = false
            }
        },

        async login(userData: UserLoginDataType) {
            this.loading = true
            this.error = null

            try {
                const response = await api.post('/users/login', userData)

                const { access_token } = response.data.result

                this.accessToken = access_token
                this.isAuthenticated = true

                // Store access token in localStorage
                localStorage.setItem('access_token', access_token)

                // Show success toast
                showSuccessToast(extractSuccessMessage(response.data, 'Welcome back!'))

                return {
                    success: true,
                    data: response.data
                }
            } catch (error) {
                console.error('Login error:', error)

                // Use the utility function to extract the error message
                this.error = extractErrorMessage(error)

                // Show error toast
                showErrorToast(extractToastErrorMessage(error, 'Failed to login'))

                return {
                    success: false,
                    error: this.error
                }
            } finally {
                this.loading = false
            }
        },

        async getUserInfo() {
            this.loading = true
            this.error = null

            try {
                const response = await api.get('/users/about-me')
                this.user = response.data.result

                // Update localStorage with fresh user data
                localStorage.setItem('user', JSON.stringify(response.data.result))
            } catch (error) {
                this.error = extractErrorMessage(error)
            } finally {
                this.loading = false
            }
        },

        async updateProfile(profileData: UpdateProfileDataType) {
            this.loading = true
            this.error = null

            try {
                const response = await api.patch('/users/about-me', profileData)
                this.user = response.data.result

                // Update localStorage with updated user data
                localStorage.setItem('user', JSON.stringify(response.data.result))

                return {
                    success: true,
                    data: response.data.result
                }
            } catch (error) {
                console.error('Update profile error:', error)
                this.error = extractErrorMessage(error)

                return {
                    success: false,
                    error: this.error
                }
            } finally {
                this.loading = false
            }
        },

        async logout() {
            this.loading = true
            this.error = null
            try {
                if (this.accessToken) {
                    await api.post('/users/logout', {})
                }

                // Show success toast after successful logout
                showSuccessToast('Logged out successfully')
            } catch (error) {
                console.error('Logout error:', error)
                this.error = extractErrorMessage(error)

                // Show error toast but still continue with logout
                showErrorToast("Logout error, but you're still logged out")
            } finally {
                // Clear state and local storage regardless of API call success
                this.user = null
                this.accessToken = ''
                this.email_verify_token = ''
                this.isAuthenticated = false

                localStorage.removeItem('user')
                localStorage.removeItem('access_token')
                localStorage.removeItem('emailVerifyToken')
                // Refresh token is cleared by the server via HTTP-only cookie

                this.loading = false
            }
        },

        async verifyEmail(emailVerifyToken: string) {
            const toast = useToast()
            this.loading = true
            this.error = null

            try {
                const response = await api.get(`/users/verify-email/${emailVerifyToken}`)

                const { access_token } = response.data.result

                this.accessToken = access_token
                localStorage.setItem('access_token', access_token)
                this.isAuthenticated = true

                await this.getUserInfo()
                localStorage.removeItem('emailVerifyToken')

                // Show success toast
                toast.successFromResponse(response.data, 'Email verified successfully!')

                return {
                    success: true,
                    data: response.data
                }
            } catch (error) {
                console.error('Email verification error:', error)
                this.error = extractErrorMessage(error)

                // Show error toast
                toast.errorFromResponse(error, 'Email verification failed')

                return {
                    success: false,
                    error: this.error
                }
            } finally {
                this.loading = false
            }
        },

        async resendVerificationEmail() {
            const toast = useToast()
            this.loading = true
            this.error = null

            try {
                const response = await api.post('/users/resend-verify-email', {})

                // Show success toast
                toast.successFromResponse(response.data, 'Verification email sent!')

                return {
                    success: true,
                    data: response.data
                }
            } catch (error) {
                console.error('Resend verification error:', error)
                this.error = extractErrorMessage(error)

                // Show error toast
                toast.errorFromResponse(error, 'Failed to resend verification email')

                return {
                    success: false,
                    error: this.error
                }
            } finally {
                this.loading = false
            }
        },

        async forgotPassword(email: string) {
            const toast = useToast()
            this.loading = true
            this.error = null

            try {
                const response = await api.post('/users/forgot-password', { email })

                // Show success toast
                toast.successFromResponse(response.data, 'Password reset email sent!')

                return {
                    success: true,
                    data: response.data
                }
            } catch (error) {
                console.error('Forgot password error:', error)
                this.error = extractErrorMessage(error)

                // Show error toast
                toast.errorFromResponse(error, 'Failed to send password reset email')

                return {
                    success: false,
                    error: this.error
                }
            } finally {
                this.loading = false
            }
        },

        async resetPassword(forgotPasswordToken: string, password: string, confirmPassword: string) {
            const toast = useToast()
            this.loading = true
            this.error = null

            try {
                const response = await api.post('/users/reset-password', {
                    forgot_password_token: forgotPasswordToken,
                    password: password,
                    confirm_password: confirmPassword
                })

                // Show success toast
                toast.successFromResponse(response.data, 'Password reset successfully!')

                return {
                    success: true,
                    data: response.data
                }
            } catch (error) {
                console.error('Reset password error:', error)
                this.error = extractErrorMessage(error)

                // Show error toast
                toast.errorFromResponse(error, 'Failed to reset password')

                return {
                    success: false,
                    error: this.error
                }
            } finally {
                this.loading = false
            }
        },

        clearError() {
            this.error = null
        }
    }
})
