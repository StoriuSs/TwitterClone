import axios from 'axios'

// Create an axios instance with base configuration
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
        'Content-Type': 'application/json'
    },
    withCredentials: true
})

// Request interceptor for authentication
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// Response interceptor to handle common error cases
api.interceptors.response.use(
    (response) => {
        return response
    },
    async (error) => {
        const originalRequest = error.config

        // Handle token refresh for 401 errors
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true

            try {
                // With HTTP-only cookies, we don't need to send the refresh token manually
                // The cookie will be sent automatically with the request
                const response = await axios.post(
                    import.meta.env.VITE_API_URL + '/users/refresh-token',
                    {},
                    { withCredentials: true }
                )
                const { access_token } = response.data.result

                // Update access token
                localStorage.setItem('accessToken', access_token)

                // Retry original request with new token
                originalRequest.headers.Authorization = `Bearer ${access_token}`
                return api(originalRequest)
            } catch (refreshError) {
                // If refresh fails, redirect to login
                localStorage.removeItem('user')
                localStorage.removeItem('accessToken')
                window.location.href = '/login'
                return Promise.reject(refreshError)
            }
        }

        return Promise.reject(error)
    }
)

export default api
