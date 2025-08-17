<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
const logout = () => {
    localStorage.removeItem('access_token')
    isLoggedIn.value = false
}

const getGoogleAuthUrl = () => {
    const url = 'https://accounts.google.com/o/oauth2/v2/auth'
    const query = {
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        redirect_uri: import.meta.env.VITE_GOOGLE_REDIRECT_URI,
        response_type: 'code',
        scope: [
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile'
        ].join(' '),
        prompt: 'consent',
        access_type: 'offline'
    }
    const queryString = new URLSearchParams(query).toString()
    return `${url}?${queryString}`
}

const googleOauthUrl = getGoogleAuthUrl()
const isLoggedIn = ref(false)
if (localStorage.getItem('access_token')) {
    isLoggedIn.value = true
}
</script>

<template>
    <div
        class="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-hidden scrollbar-hide"
    >
        <h1 v-if="isLoggedIn" class="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
            Welcome back to Kwitter!
        </h1>
        <h1 v-else class="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
            Welcome to the platform! We are Kwitter
        </h1>
        <div class="space-y-4">
            <Button variant="default" class="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                >Shadcn Button</Button
            >
            <Button
                variant="outline"
                class="w-full border-gray-300 dark:border-gray-700 dark:text-white dark:hover:bg-gray-800"
                asChild
            >
                <a :href="googleOauthUrl">Login with Google</a>
            </Button>
            <Button variant="destructive" @click="logout">Logout</Button>
        </div>
    </div>
</template>
