import { defineStore } from 'pinia'
import api from '@/lib/api'
import type { UserRegistrationDataType, UserLoginDataType, AuthStateType } from '@/interfaces/auth.interface'
import { extractErrorMessage } from '@/interfaces/error.interface'

export const useAuthStore = defineStore('auth', {
    state: (): AuthStateType => ({
        user: JSON.parse(localStorage.getItem('user') || 'null'),
        accessToken: localStorage.getItem('accessToken') || '',
        email_verify_token: '',
        isAuthenticated: !!localStorage.getItem('accessToken'),
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

                // Store access token in localStorage
                localStorage.setItem('accessToken', access_token)
                // Refresh token is automatically stored in HTTP-only cookie by the server
                return {
                    success: true,
                    data: response.data
                }
            } catch (error) {
                console.error('Registration error:', error)

                // Use the utility function to extract the error message
                this.error = extractErrorMessage(error)

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
                localStorage.setItem('accessToken', access_token)

                return {
                    success: true,
                    data: response.data
                }
            } catch (error) {
                console.error('Login error:', error)

                // Use the utility function to extract the error message
                this.error = extractErrorMessage(error)

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
            } catch (error) {
                this.error = extractErrorMessage(error)
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
            } catch (error) {
                console.error('Logout error:', error)
                this.error = extractErrorMessage(error)
            } finally {
                // Clear state and local storage regardless of API call success
                this.user = null
                this.accessToken = ''
                this.email_verify_token = ''
                this.isAuthenticated = false

                localStorage.removeItem('user')
                localStorage.removeItem('accessToken')
                // Refresh token is cleared by the server via HTTP-only cookie

                this.loading = false
            }
        },

        clearError() {
            this.error = null
        }
    }
})
