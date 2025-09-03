<script setup lang="ts">
import { onMounted } from 'vue'
import { useTweetsStore } from '@/stores/tweets'
import Button from '@/components/ui/button/Button.vue'

const tweetsStore = useTweetsStore()

onMounted(() => {
    tweetsStore.fetchWhoToFollow()
})
</script>

<template>
    <div class="mt-4 bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
        <h2 class="text-xl font-bold mb-4">Who to follow</h2>
        <div v-if="tweetsStore.loading" class="py-3 text-center">
            <p class="text-gray-500">Loading suggestions...</p>
        </div>
        <template v-else>
            <div v-for="user in tweetsStore.whoToFollow" :key="user.id" class="py-3 flex items-center">
                <img :src="user.avatar" alt="Profile" class="w-12 h-12 rounded-full" />
                <div class="ml-3 flex-1">
                    <p class="font-bold">{{ user.name }}</p>
                    <p class="text-gray-500 dark:text-gray-400 text-sm">@{{ user.username }}</p>
                </div>
                <Button
                    variant="default"
                    class="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 rounded-full px-4 py-1 text-sm font-bold"
                >
                    Follow
                </Button>
            </div>
        </template>
        <a href="#" class="text-blue-500 hover:underline text-sm">Show more</a>
    </div>
</template>
