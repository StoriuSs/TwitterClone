<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const verificationStatus = ref<'loading' | 'success' | 'error'>('loading')
const errorMessage = ref('')

onMounted(async () => {
    const emailVerifyToken = route.query.token as string

    if (!emailVerifyToken) {
        verificationStatus.value = 'error'
        errorMessage.value = 'Invalid verification link'
        return
    }

    try {
        const result = await authStore.verifyEmail(emailVerifyToken)

        if (result.success) {
            verificationStatus.value = 'success'

            // Redirect to home page after 3 seconds
            setTimeout(() => {
                router.push('/')
            }, 3000)
        } else {
            verificationStatus.value = 'error'
            errorMessage.value = result.error || 'Verification failed'
        }
    } catch (err) {
        console.error('Verification error:', err)
        verificationStatus.value = 'error'
        errorMessage.value = 'An unexpected error occurred'
    }
})

const goToLogin = () => {
    router.push('/login')
}
</script>

<template>
    <div
        class="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
    >
        <div class="w-full max-w-md">
            <!-- Logo -->
            <div class="flex justify-center mb-6">
                <svg class="w-12 h-12 text-blue-500 dark:text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                    <path
                        d="M23.643 4.937c-.835.37-1.732.62-2.675.733.962-.576 1.7-1.49 2.048-2.578-.9.534-1.897.922-2.958 1.13-.85-.904-2.06-1.47-3.4-1.47-2.572 0-4.658 2.086-4.658 4.66 0 .364.042.718.12 1.06-3.873-.195-7.304-2.05-9.602-4.868-.4.69-.63 1.49-.63 2.342 0 1.616.823 3.043 2.072 3.878-.764-.025-1.482-.234-2.11-.583v.06c0 2.257 1.605 4.14 3.737 4.568-.392.106-.803.162-1.227.162-.3 0-.593-.028-.877-.082.593 1.85 2.313 3.198 4.352 3.234-1.595 1.25-3.604 1.995-5.786 1.995-.376 0-.747-.022-1.112-.065 2.062 1.323 4.51 2.093 7.14 2.093 8.57 0 13.255-7.098 13.255-13.254 0-.2-.005-.402-.014-.602.91-.658 1.7-1.477 2.323-2.41z"
                    ></path>
                </svg>
            </div>

            <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md dark:shadow-gray-800/30">
                <!-- Loading State -->
                <div v-if="verificationStatus === 'loading'" class="text-center space-y-4">
                    <h1 class="text-2xl font-bold mb-4">Verifying your email</h1>
                    <div class="flex justify-center">
                        <svg
                            class="animate-spin h-12 w-12 text-blue-500"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                class="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                stroke-width="4"
                            ></circle>
                            <path
                                class="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                        </svg>
                    </div>
                    <p class="text-gray-600 dark:text-gray-400">Please wait while we verify your email address...</p>
                </div>

                <!-- Success State -->
                <div v-else-if="verificationStatus === 'success'" class="text-center space-y-4">
                    <h1 class="text-2xl font-bold mb-4 text-green-600 dark:text-green-400">
                        Email verified successfully!
                    </h1>
                    <div class="flex justify-center mb-6">
                        <svg
                            class="w-16 h-16 text-green-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            ></path>
                        </svg>
                    </div>
                    <p class="text-gray-600 dark:text-gray-400 mb-4">
                        Your email has been verified successfully. You can now access all features of your account.
                    </p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                        You will be redirected to the home page in a few seconds...
                    </p>
                </div>

                <!-- Error State -->
                <div v-else class="text-center space-y-4">
                    <h1 class="text-2xl font-bold mb-4 text-red-600 dark:text-red-400">Verification failed</h1>
                    <div class="flex justify-center mb-6">
                        <svg
                            class="w-16 h-16 text-red-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z"
                            ></path>
                        </svg>
                    </div>
                    <p class="text-red-600 dark:text-red-400 mb-4">
                        {{ errorMessage }}
                    </p>
                    <p class="text-gray-600 dark:text-gray-400 mb-6">
                        The verification link may have expired or is invalid. Please try requesting a new verification
                        email.
                    </p>
                    <Button
                        @click="goToLogin"
                        class="w-full bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                    >
                        Go to Login
                    </Button>
                </div>
            </div>
        </div>
    </div>
</template>
