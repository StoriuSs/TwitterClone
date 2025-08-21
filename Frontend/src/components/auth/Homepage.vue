<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import Button from '../ui/button/Button.vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const authStore = useAuthStore()
const handleLogout = async () => {
    await authStore.logout()
    router.push('/signup')
}
</script>

<template>
    <div
        class="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-hidden scrollbar-hide"
    >
        <h1 class="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Welcome to the platform! We are Kwitter</h1>
        <div class="space-y-4">
            <video src="http://localhost:8888/static/video/adomk3a3oghfizkvs67dsslht.mp4" controls></video>
        </div>
        <Button @click="handleLogout">Logout</Button>
    </div>
</template>
