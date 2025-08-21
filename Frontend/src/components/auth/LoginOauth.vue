<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

onMounted(async () => {
    try {
        // Get the access token from the URL query parameters
        const accessToken = route.query.access_token as string

        if (!accessToken) {
            throw new Error('No access token provided')
        }

        // Store the access token and set authenticated state
        authStore.accessToken = accessToken
        authStore.isAuthenticated = true
        localStorage.setItem('access_token', accessToken)

        // Fetch user info to store in state and localStorage
        await authStore.getUserInfo()

        if (authStore.user) {
            localStorage.setItem('user', JSON.stringify(authStore.user))
        }

        // Redirect based on whether this is a new user or returning user
        router.push('/')
    } catch (error) {
        console.error('OAuth login error:', error)
        // Redirect to login page on error
        router.push('/login')
    }
})
</script>

<template>
    <div class="h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div class="text-center">
            <div class="flex justify-center mb-8">
                <svg
                    class="w-12 h-12 text-blue-500 dark:text-blue-400 animate-bounce"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                >
                    <path
                        d="M23.643 4.937c-.835.37-1.732.62-2.675.733.962-.576 1.7-1.49 2.048-2.578-.9.534-1.897.922-2.958 1.13-.85-.904-2.06-1.47-3.4-1.47-2.572 0-4.658 2.086-4.658 4.66 0 .364.042.718.12 1.06-3.873-.195-7.304-2.05-9.602-4.868-.4.69-.63 1.49-.63 2.342 0 1.616.823 3.043 2.072 3.878-.764-.025-1.482-.234-2.11-.583v.06c0 2.257 1.605 4.14 3.737 4.568-.392.106-.803.162-1.227.162-.3 0-.593-.028-.877-.082.593 1.85 2.313 3.198 4.352 3.234-1.595 1.25-3.604 1.995-5.786 1.995-.376 0-.747-.022-1.112-.065 2.062 1.323 4.51 2.093 7.14 2.093 8.57 0 13.255-7.098 13.255-13.254 0-.2-.005-.402-.014-.602.91-.658 1.7-1.477 2.323-2.41z"
                    ></path>
                </svg>
            </div>
            <p class="text-xl text-gray-800 dark:text-white mb-2">Logging you in...</p>
            <p class="text-sm text-gray-500 dark:text-gray-400">Please wait while we authenticate you</p>
        </div>
    </div>
</template>
