<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTweetsStore } from '@/stores/tweets'
import { useAuthStore } from '@/stores/auth'

import ComposeTweet from '@/components/tweets/ComposeTweet.vue'
import TweetList from '@/components/tweets/TweetList.vue'

const router = useRouter()
const tweetsStore = useTweetsStore()
const authStore = useAuthStore()

const activeTab = ref('for-you') // Options: 'for-you', 'following'
const isLoadingMore = ref(false)
const isInitialLoading = ref(true) // Track initial loading state

// Fetch tweets when component is mounted
onMounted(async () => {
    try {
        if (!authStore.user) {
            await authStore.getUserInfo()
        }

        tweetsStore.tweets = []
        await tweetsStore.fetchNewsFeed(1, 10, activeTab.value)
    } catch (error) {
        console.error('Error loading home page:', error)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((error as any).response?.status === 403) {
            router.push('/verify-email')
        }
    } finally {
        isInitialLoading.value = false
    }
})

const switchTab = async (tab: string) => {
    activeTab.value = tab
    // Clear tweets and set loading before fetching new feed
    tweetsStore.tweets = []
    tweetsStore.loading = true
    isInitialLoading.value = false
    await tweetsStore.fetchNewsFeed(1, 10, tab)
}

const loadMoreTweets = async () => {
    if (tweetsStore.currentPage < tweetsStore.totalPages && !isLoadingMore.value) {
        isLoadingMore.value = true
        await tweetsStore.fetchNewsFeed(tweetsStore.currentPage + 1, 10, activeTab.value)
        isLoadingMore.value = false
    }
}

const handleTweetPosted = async () => {
    // This will be called after a tweet is posted
    // Always switch to "for-you" tab after posting to match the returned feed content
    activeTab.value = 'for-you'
    await tweetsStore.fetchNewsFeed(1, 10, 'for-you')
}
</script>

<template>
    <!-- Header -->
    <div
        class="sticky top-0 z-10 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800"
    >
        <!-- Header title -->
        <div class="flex items-center justify-between px-4 py-3">
            <h1 class="text-xl font-bold">Home</h1>
            <button class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="feather feather-settings text-gray-800 dark:text-gray-200"
                >
                    <circle cx="12" cy="12" r="3"></circle>
                    <path
                        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
                    ></path>
                </svg>
            </button>
        </div>

        <!-- For you / Following tabs -->
        <div class="flex">
            <button
                @click="switchTab('for-you')"
                class="flex-1 py-4 text-center font-medium relative hover:bg-gray-100 dark:hover:bg-gray-800"
                :class="activeTab === 'for-you' ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'"
            >
                For you
                <div
                    v-if="activeTab === 'for-you'"
                    class="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-14 h-1 bg-blue-500 rounded-full"
                ></div>
            </button>

            <button
                @click="switchTab('following')"
                class="flex-1 py-4 text-center font-medium relative hover:bg-gray-100 dark:hover:bg-gray-800"
                :class="
                    activeTab === 'following' ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
                "
            >
                Following
                <div
                    v-if="activeTab === 'following'"
                    class="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-14 h-1 bg-blue-500 rounded-full"
                ></div>
            </button>
        </div>
    </div>

    <!-- Tweet composer inline (only show on larger screens) -->
    <div class="border-b border-gray-200 dark:border-gray-800 hidden sm:block">
        <ComposeTweet @tweet-posted="handleTweetPosted" />
    </div>

    <!-- Tweet List -->
    <div class="divide-y divide-gray-200 dark:divide-gray-800">
        <TweetList
            :tweets="tweetsStore.tweets"
            :loading="tweetsStore.loading || isInitialLoading"
            :current-page="tweetsStore.currentPage"
            :total-pages="tweetsStore.totalPages"
            :load-more-tweets="loadMoreTweets"
            :is-loading-more="isLoadingMore"
        />
    </div>
</template>
