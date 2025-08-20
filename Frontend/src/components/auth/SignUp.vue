<script setup lang="ts">
// import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useGetGoogleAuthUrl } from '@/composables/useGetGoogleAuthUrl'

const googleOauthUrl = useGetGoogleAuthUrl()
</script>

<template>
    <div class="flex min-h-screen overflow-hidden scrollbar-hide">
        <!-- Left side - Blue background with Twitter logo -->
        <div class="hidden md:block md:w-1/2 bg-blue-500 relative overflow-hidden dark:bg-blue-800">
            <div class="absolute inset-0 bg-[url('/imgs/twitter-pattern.png')] opacity-20"></div>
            <div class="flex items-center justify-center h-full">
                <svg class="w-64 h-64 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <!-- Twitter/bird logo path -->
                    <path
                        d="M23.643 4.937c-.835.37-1.732.62-2.675.733.962-.576 1.7-1.49 2.048-2.578-.9.534-1.897.922-2.958 1.13-.85-.904-2.06-1.47-3.4-1.47-2.572 0-4.658 2.086-4.658 4.66 0 .364.042.718.12 1.06-3.873-.195-7.304-2.05-9.602-4.868-.4.69-.63 1.49-.63 2.342 0 1.616.823 3.043 2.072 3.878-.764-.025-1.482-.234-2.11-.583v.06c0 2.257 1.605 4.14 3.737 4.568-.392.106-.803.162-1.227.162-.3 0-.593-.028-.877-.082.593 1.85 2.313 3.198 4.352 3.234-1.595 1.25-3.604 1.995-5.786 1.995-.376 0-.747-.022-1.112-.065 2.062 1.323 4.51 2.093 7.14 2.093 8.57 0 13.255-7.098 13.255-13.254 0-.2-.005-.402-.014-.602.91-.658 1.7-1.477 2.323-2.41z"
                    ></path>
                </svg>
            </div>
        </div>

        <!-- Right side - Sign up form -->
        <div class="w-full md:w-1/2 p-8 flex flex-col justify-center bg-white dark:bg-gray-900">
            <div class="max-w-md mx-auto w-full space-y-8">
                <!-- Logo for mobile view -->
                <div class="md:hidden flex justify-center">
                    <svg class="w-12 h-12 text-blue-500 dark:text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                        <path
                            d="M23.643 4.937c-.835.37-1.732.62-2.675.733.962-.576 1.7-1.49 2.048-2.578-.9.534-1.897.922-2.958 1.13-.85-.904-2.06-1.47-3.4-1.47-2.572 0-4.658 2.086-4.658 4.66 0 .364.042.718.12 1.06-3.873-.195-7.304-2.05-9.602-4.868-.4.69-.63 1.49-.63 2.342 0 1.616.823 3.043 2.072 3.878-.764-.025-1.482-.234-2.11-.583v.06c0 2.257 1.605 4.14 3.737 4.568-.392.106-.803.162-1.227.162-.3 0-.593-.028-.877-.082.593 1.85 2.313 3.198 4.352 3.234-1.595 1.25-3.604 1.995-5.786 1.995-.376 0-.747-.022-1.112-.065 2.062 1.323 4.51 2.093 7.14 2.093 8.57 0 13.255-7.098 13.255-13.254 0-.2-.005-.402-.014-.602.91-.658 1.7-1.477 2.323-2.41z"
                        ></path>
                    </svg>
                </div>

                <div class="text-center">
                    <h1 class="text-4xl font-bold mb-10 text-gray-900 dark:text-white">
                        See what's happening in the world right now
                    </h1>
                    <h2 class="text-2xl font-semibold mb-6 text-gray-700 dark:text-gray-300">Join Kwitter today.</h2>
                </div>

                <div class="space-y-4">
                    <!-- Google Sign up -->
                    <Button
                        variant="outline"
                        class="w-full flex items-center justify-center gap-2 py-6 border-gray-300 dark:border-gray-700 dark:text-white dark:hover:bg-gray-800"
                        asChild
                    >
                        <a :href="googleOauthUrl">
                            <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                            <span class="ml-2">Sign up with Google</span>
                        </a>
                    </Button>

                    <!-- Apple Sign up (Disabled) -->
                    <Button
                        variant="outline"
                        disabled
                        class="w-full flex items-center justify-center gap-2 py-6 border-gray-300 dark:border-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-70 relative"
                    >
                        <svg
                            class="w-5 h-5 opacity-70"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                        >
                            <path
                                d="M16.5 3.5a2.5 2.5 0 0 1-1 2c-1 1-2 1.5-3 1.5-2 0-3-1.75-3-1.75S8 7 6 7c-2.5 0-4.5 3-4.5 3s2.75 12.5 5 12.5c1 0 2-1 3.5-1s2.5 1 3.5 1c2.25 0 5-12.5 5-12.5s-2-3-4-3c-1.75 0-3 1-3 1z"
                            />
                            <path
                                d="M12.5 0.5C13.75 0.5 15 1 16 2c-0.5 0.5-1 1-1.25 1.75-0.25 0.75-0.25 1.75 0.25 2.75C13.75 6 12.5 5.5 11.5 5.5c-1.5 0-2.5 1-3.5 1C8 5 8.5 3.5 9 2.5 9.5 1.5 11 0.5 12.5 0.5z"
                            />
                        </svg>
                        <span class="ml-2">Sign up with Apple</span>
                        <span class="absolute right-3 text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full"
                            >Coming soon</span
                        >
                    </Button>

                    <div class="flex items-center justify-center">
                        <Separator class="flex-grow dark:bg-gray-700" />
                        <span class="px-4 text-sm text-gray-500 dark:text-gray-400">or</span>
                        <Separator class="flex-grow dark:bg-gray-700" />
                    </div>

                    <!-- Email Sign up -->
                    <Button
                        variant="default"
                        class="w-full py-6 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                        @click="$router.push('/signup/email')"
                    >
                        Sign up with email
                    </Button>

                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        By signing up, you agree to the
                        <a href="#" class="text-blue-500 hover:underline dark:text-blue-400">Terms of Service</a> and
                        <a href="#" class="text-blue-500 hover:underline dark:text-blue-400">Privacy Policy</a>,
                        including <a href="#" class="text-blue-500 hover:underline dark:text-blue-400">Cookie Use</a>.
                    </p>

                    <div class="mt-8">
                        <p class="text-gray-700 dark:text-gray-300">Already have an account?</p>
                        <Button
                            variant="outline"
                            class="w-full mt-2 text-blue-500 border-blue-500 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-700 dark:hover:bg-gray-800"
                            @click="$router.push('/login')"
                        >
                            Sign in
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
