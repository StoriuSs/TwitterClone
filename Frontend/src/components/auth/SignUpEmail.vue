<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const name = ref('')
const email = ref('')
const password = ref('')
const dateOfBirth = ref('')
const signUpStep = ref(1)
const isLoading = ref(false)

const nextStep = () => {
    signUpStep.value++
}

const prevStep = () => {
    signUpStep.value--
}

const submitForm = () => {
    isLoading.value = true
    // TODO: Implement actual signup functionality
    setTimeout(() => {
        isLoading.value = false
        // On success, redirect or show success message
    }, 1500)
}
</script>

<template>
    <div
        class="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-hidden scrollbar-hide"
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

            <!-- Form Header -->
            <h1 class="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Create your account</h1>

            <!-- Step 1: Basic Info -->
            <div v-if="signUpStep === 1" class="space-y-4">
                <div>
                    <Label for="name" class="text-gray-900 dark:text-gray-200">Name</Label>
                    <Input
                        id="name"
                        v-model="name"
                        type="text"
                        placeholder="Name"
                        class="mt-1 bg-white dark:bg-gray-800 dark:text-white dark:border-gray-700"
                        required
                    />
                </div>

                <div>
                    <Label for="email" class="text-gray-900 dark:text-gray-200">Email or phone number</Label>
                    <Input
                        id="email"
                        v-model="email"
                        type="text"
                        placeholder="Email or phone number"
                        class="mt-1 bg-white dark:bg-gray-800 dark:text-white dark:border-gray-700"
                        required
                    />
                </div>

                <div>
                    <Label for="dob" class="text-gray-900 dark:text-gray-200">Date of birth</Label>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">This won't be public</p>
                    <Input
                        id="dob"
                        v-model="dateOfBirth"
                        type="date"
                        class="mt-1 bg-white dark:bg-gray-800 dark:text-white dark:border-gray-700"
                        required
                    />
                </div>

                <Button
                    class="w-full mt-6 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                    variant="default"
                    :disabled="!name || !email || !dateOfBirth"
                    @click="nextStep"
                >
                    Next
                </Button>
            </div>

            <!-- Step 2: Password -->
            <div v-if="signUpStep === 2" class="space-y-4">
                <div>
                    <Label for="password" class="text-gray-900 dark:text-gray-200">Create a password</Label>
                    <Input
                        id="password"
                        v-model="password"
                        type="password"
                        placeholder="Password"
                        class="mt-1 bg-white dark:bg-gray-800 dark:text-white dark:border-gray-700"
                        required
                    />
                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Password must be at least 8 characters</p>
                </div>

                <div class="flex gap-2 mt-6">
                    <Button
                        variant="outline"
                        @click="prevStep"
                        class="w-1/3 border-gray-300 dark:border-gray-700 dark:text-white dark:hover:bg-gray-800"
                    >
                        Back
                    </Button>
                    <Button
                        class="w-2/3 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
                        variant="default"
                        :disabled="!password || password.length < 8 || isLoading"
                        @click="submitForm"
                    >
                        <span v-if="isLoading">
                            <svg
                                class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                            Processing...
                        </span>
                        <span v-else>Sign up</span>
                    </Button>
                </div>
            </div>

            <!-- Return to login -->
            <div class="mt-8 text-center">
                <p class="text-gray-900 dark:text-gray-200">
                    Already have an account?
                    <router-link to="/login" class="text-blue-500 hover:underline dark:text-blue-400"
                        >Log in</router-link
                    >
                </p>
            </div>
        </div>
    </div>
</template>
