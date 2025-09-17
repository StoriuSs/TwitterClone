<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const email = ref('')
const loading = ref(false)
const showSuccess = ref(false)

const handleSubmit = async () => {
    if (!email.value || loading.value) return

    loading.value = true
    showSuccess.value = false

    const result = await authStore.forgotPassword(email.value)

    if (result.success) {
        showSuccess.value = true
        email.value = '' // Clear form on success
    }

    loading.value = false
}

onMounted(() => {
    authStore.clearError()
})
</script>

<template>
    <div
        class="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex items-center justify-center px-6"
    >
        <div class="max-w-md w-full space-y-8">
            <!-- Header -->
            <div class="text-center">
                <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">Find your Twitter account</h2>
                <p class="text-gray-600 dark:text-gray-400 text-sm">
                    Enter your email address and we'll send you a link to reset your password.
                </p>
            </div>

            <!-- Form -->
            <form @submit.prevent="handleSubmit" class="space-y-6">
                <!-- Email Input -->
                <div>
                    <label for="email" class="sr-only">Email address</label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        autocomplete="email"
                        required
                        v-model="email"
                        :disabled="loading"
                        class="appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-400 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="Enter your email address"
                    />
                </div>

                <!-- Error Message -->
                <div
                    v-if="authStore.error"
                    class="text-red-600 dark:text-red-400 text-sm text-center bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-3 rounded-md"
                >
                    {{ authStore.error }}
                </div>

                <!-- Submit Button -->
                <div>
                    <button
                        type="submit"
                        :disabled="loading || !email"
                        class="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-300"
                    >
                        <span v-if="loading" class="flex items-center">
                            <svg
                                class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                            Sending...
                        </span>
                        <span v-else>Send reset link</span>
                    </button>
                </div>

                <!-- Success Message -->
                <div
                    v-if="showSuccess"
                    class="text-green-600 dark:text-green-400 text-sm text-center bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 p-3 rounded-md"
                >
                    <p class="font-medium">Email sent successfully!</p>
                    <p class="mt-1">Check your email for the password reset link.</p>
                </div>

                <!-- Back to Login Link -->
                <div class="text-center">
                    <router-link
                        to="/login"
                        class="text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 text-sm transition duration-300"
                    >
                        Back to login
                    </router-link>
                </div>
            </form>
        </div>
    </div>
</template>
