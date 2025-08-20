<script setup lang="ts">
import { ref } from 'vue'
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
            <video src="http://localhost:8888/static/video/adomk3a3oghfizkvs67dsslht.mp4" controls></video>
        </div>
    </div>
</template>
