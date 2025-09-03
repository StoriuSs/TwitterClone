<script setup lang="ts">
import { onMounted } from 'vue'
import { useTweetsStore } from '@/stores/tweets'
import { Separator } from '@/components/ui/separator'

const tweetsStore = useTweetsStore()

onMounted(() => {
    tweetsStore.fetchTrendingTopics()
})
</script>

<template>
    <div class="mt-4 bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
        <h2 class="text-xl font-bold mb-4">Trends for you</h2>
        <div v-if="tweetsStore.loading" class="py-3 text-center">
            <p class="text-gray-500">Loading trends...</p>
        </div>
        <template v-else>
            <div v-for="(trend, index) in tweetsStore.trendingTopics" :key="trend.id">
                <div class="py-3">
                    <p class="text-xs text-gray-500 dark:text-gray-400">{{ trend.category }}</p>
                    <p class="font-bold">{{ trend.title }}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">{{ trend.tweets }}</p>
                </div>
                <Separator v-if="index < tweetsStore.trendingTopics.length - 1" />
            </div>
        </template>
        <a href="#" class="text-blue-500 hover:underline text-sm">Show more</a>
    </div>
</template>
