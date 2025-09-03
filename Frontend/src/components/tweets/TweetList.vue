<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useTweetsStore } from '@/stores/tweets'
import TweetItem from './TweetItem.vue'

const props = defineProps<{
    feedType?: string
}>()

const tweetsStore = useTweetsStore()
const isLoadingMore = ref(false)

onMounted(async () => {
    await tweetsStore.fetchNewsFeed()
})

// Watch for changes in feed type and refresh when it changes
watch(
    () => props.feedType,
    async (newFeedType) => {
        if (newFeedType) {
            await tweetsStore.fetchNewsFeed(1) // Reset to first page when switching tabs
        }
    }
)

const loadMoreTweets = async () => {
    if (tweetsStore.currentPage < tweetsStore.totalPages && !isLoadingMore.value) {
        isLoadingMore.value = true
        await tweetsStore.fetchNewsFeed(tweetsStore.currentPage + 1)
        isLoadingMore.value = false
    }
}
</script>

<template>
    <div class="w-full">
        <div v-if="tweetsStore.loading && tweetsStore.tweets.length === 0" class="p-6 text-center">
            <p class="text-gray-500 dark:text-gray-400 text-lg">Loading tweets...</p>
        </div>
        <div v-else-if="tweetsStore.tweets.length === 0" class="p-6 text-center">
            <p class="text-gray-500 dark:text-gray-400 text-lg">No tweets to display.</p>
            <p class="text-gray-500 dark:text-gray-400 mt-2">Follow people or post something to get started!</p>
        </div>
        <template v-else>
            <TweetItem v-for="tweet in tweetsStore.tweets" :key="tweet._id" :tweet="tweet" />

            <div class="p-6 text-center">
                <button
                    v-if="tweetsStore.currentPage < tweetsStore.totalPages"
                    @click="loadMoreTweets"
                    class="px-6 py-3 text-blue-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full font-medium"
                    :disabled="isLoadingMore"
                >
                    {{ isLoadingMore ? 'Loading...' : 'Load more tweets' }}
                </button>
                <p v-else class="text-gray-500 dark:text-gray-400 text-lg">No more tweets to load</p>
            </div>
        </template>
    </div>
</template>
