<script setup lang="ts">
import { ref } from 'vue'
import { useTweetsStore } from '@/stores/tweets'
import Player from '../player/Player.vue'
import { X, Search } from 'lucide-vue-next'

import Sidebar from './Sidebar.vue'
import ComposeTweet from '../tweets/ComposeTweet.vue'
import TweetList from '../tweets/TweetList.vue'
import TrendingPanel from './TrendingPanel.vue'
import WhoToFollowPanel from './WhoToFollowPanel.vue'

import { Dialog, DialogContent, DialogHeader, DialogClose } from '@/components/ui/dialog'

const tweetsStore = useTweetsStore()

const activeTab = ref('for-you') // Options: 'for-you', 'following'
const isComposing = ref(false)

const openComposer = () => {
    isComposing.value = true
}

const closeComposer = () => {
    isComposing.value = false
}

const switchTab = async (tab: string) => {
    activeTab.value = tab
    // Update the feed based on the selected tab
    await tweetsStore.fetchNewsFeed(1, 10, tab)
}

const handleTweetPosted = async () => {
    // This will be called after a tweet is posted
    await tweetsStore.fetchNewsFeed(1)
}
</script>

<template>
    <div class="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white">
        <!-- Main layout with centered content -->
        <div class="flex justify-center min-h-screen transition-all duration-300 max-w-7xl mx-auto relative">
            <!-- Left sidebar placeholder for mobile (where sidebar is fixed) -->
            <div class="w-[68px] sm:w-[68px] md:w-[88px] lg:hidden shrink-0 max-[420px]:hidden"></div>

            <!-- Sidebar - fixed on mobile, static on larger screens -->
            <Sidebar :open-composer="openComposer" active-page="home" />

            <!-- Main content - Feed (add bottom padding for mobile bottom nav on smallest screens) -->
            <main
                class="border-r border-gray-200 dark:border-gray-800 min-h-screen max-[420px]:pb-[60px] md:pb-0 w-full max-w-[600px] flex-grow"
            >
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
                            :class="
                                activeTab === 'for-you'
                                    ? 'text-gray-900 dark:text-white'
                                    : 'text-gray-500 dark:text-gray-400'
                            "
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
                                activeTab === 'following'
                                    ? 'text-gray-900 dark:text-white'
                                    : 'text-gray-500 dark:text-gray-400'
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

                <!-- Tweet compose box -->
                <div class="border-b border-gray-200 dark:border-gray-800">
                    <ComposeTweet @tweet-posted="handleTweetPosted" />
                </div>

                <!-- Feed -->
                <div>
                    <!-- Video component -->
                    <div class="border-b border-gray-200 dark:border-gray-800 p-4">
                        <h2 class="text-xl font-bold mb-4">Featured Video</h2>
                        <Player class="w-full rounded-xl overflow-hidden" />
                    </div>

                    <!-- Tweets -->
                    <TweetList :feed-type="activeTab" />
                </div>
            </main>

            <!-- Right sidebar - Trends and suggestions -->
            <aside class="hidden lg:block px-6 w-[350px] sticky top-0 h-screen overflow-auto flex-shrink-0">
                <!-- Search -->
                <div class="sticky top-0 py-2 bg-white dark:bg-black z-10">
                    <div class="relative">
                        <Search
                            class="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400"
                        />
                        <input
                            type="text"
                            placeholder="Search Kwitter"
                            class="w-full bg-gray-100 dark:bg-gray-800 rounded-full pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                        />
                    </div>
                </div>

                <!-- Trends for you -->
                <TrendingPanel />

                <!-- Who to follow -->
                <WhoToFollowPanel />

                <!-- Footer links -->
                <div class="mt-4 text-xs text-gray-500 dark:text-gray-400">
                    <div class="flex flex-wrap gap-2">
                        <a href="#" class="hover:underline">Terms of Service</a>
                        <a href="#" class="hover:underline">Privacy Policy</a>
                        <a href="#" class="hover:underline">Cookie Policy</a>
                        <a href="#" class="hover:underline">Accessibility</a>
                        <a href="#" class="hover:underline">Ads info</a>
                        <a href="#" class="hover:underline">More</a>
                    </div>
                    <p class="mt-2">© 2025 Kwitter, Inc.</p>
                </div>
            </aside>
        </div>

        <!-- Tweet Compose Modal using Shadcn Dialog -->
        <Dialog
            :open="isComposing"
            @update:open="
                (open: boolean) => {
                    if (!open) closeComposer()
                }
            "
        >
            <DialogContent class="sm:max-w-xl">
                <DialogHeader>
                    <div class="flex items-center justify-between">
                        <DialogClose class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                            <X class="w-5 h-5" />
                        </DialogClose>
                    </div>
                </DialogHeader>
                <div class="p-4">
                    <ComposeTweet :is-modal="true" :close-modal="closeComposer" @tweet-posted="handleTweetPosted" />
                </div>
            </DialogContent>
        </Dialog>

        <!-- Floating compose button (adjust position for bottom navigation on smallest screens) -->
        <button
            @click="openComposer"
            class="fixed right-5 bottom-8 max-[420px]:bottom-16 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-4 shadow-lg z-20 transition-transform duration-200 transform hover:scale-105 lg:hidden"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="feather feather-plus"
            >
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
        </button>
    </div>
</template>
