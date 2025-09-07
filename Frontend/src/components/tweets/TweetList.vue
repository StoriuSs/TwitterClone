<script setup lang="ts">
import TweetItem from './TweetItem.vue'
import Spinner from '../ui/Spinner.vue'

const props = defineProps<{
    tweets: any[]
    loading: boolean
    currentPage: number
    totalPages: number
    loadMoreTweets: () => void
    isLoadingMore?: boolean
}>()
</script>

<template>
    <div class="w-full">
        <div v-if="props.loading && props.tweets.length === 0" class="p-6 text-center">
            <Spinner />
        </div>
        <div v-else-if="props.tweets.length === 0" class="p-6 text-center">
            <p class="text-gray-500 dark:text-gray-400 text-lg">No tweets to display.</p>
            <p class="text-gray-500 dark:text-gray-400 mt-2">Follow people or post something to get started!</p>
        </div>
        <template v-else>
            <TweetItem v-for="tweet in props.tweets" :key="tweet._id" :tweet="tweet" />

            <div class="p-6 text-center">
                <button
                    v-if="props.currentPage < props.totalPages"
                    @click="props.loadMoreTweets"
                    class="px-6 py-3 text-blue-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full font-medium flex items-center justify-center gap-2"
                    :disabled="props.isLoadingMore"
                >
                    <template v-if="props.isLoadingMore">
                        <Spinner class="h-5 w-5" />
                        Loading...
                    </template>
                    <template v-else> Load more tweets </template>
                </button>
                <p v-else class="text-gray-500 dark:text-gray-400 text-lg">No more tweets to load</p>
            </div>
        </template>
    </div>
</template>
