<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTweetsStore } from '@/stores/tweets'
import { Search, X } from 'lucide-vue-next'

import Sidebar from './Sidebar.vue'
import ComposeTweet from '@/components/tweets/ComposeTweet.vue'
import TrendingPanel from './TrendingPanel.vue'
import WhoToFollowPanel from './WhoToFollowPanel.vue'
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

const route = useRoute()
const router = useRouter()
const tweetsStore = useTweetsStore()

const isComposing = ref(false)

// Determine current page for sidebar highlighting
const currentPage = computed(() => {
    const name = route.name as string
    if (name === 'home') return 'home'
    if (name === 'profile') return 'profile'
    if (name?.startsWith('search')) return 'search'
    if (name?.startsWith('notifications')) return 'notifications'
    if (name?.startsWith('messages')) return 'messages'
    if (name?.startsWith('bookmarks')) return 'bookmarks'
    return 'home' // default
})

// Shared composer functions
const openComposer = () => {
    isComposing.value = true
}

const closeComposer = () => {
    isComposing.value = false
}

const handleTweetPosted = async () => {
    closeComposer()

    // If not on the home page, navigate to it
    if (route.name !== 'home') {
        await router.push({ name: 'home' })
    } else {
        // Already on home page, just refresh the feed
        await tweetsStore.fetchNewsFeed(1, 10, 'for-you')
    }
}
</script>

<template>
    <div class="h-screen bg-white dark:bg-black text-gray-900 dark:text-white">
        <!-- Main layout with centered content -->
        <div class="flex justify-center h-screen transition-all duration-300 max-w-7xl mx-auto relative">
            <!-- Left sidebar placeholder for mobile -->
            <div class="w-[68px] sm:w-[68px] md:w-[88px] lg:hidden shrink-0 max-[420px]:hidden"></div>

            <!-- Sidebar -->
            <Sidebar :open-composer="openComposer" :active-page="currentPage" />

            <!-- Main content area - where page content will be rendered -->
            <main
                class="border-r border-gray-200 dark:border-gray-800 h-screen max-[420px]:pb-[60px] md:pb-0 w-full max-w-[600px] flex-grow overflow-y-auto"
            >
                <router-view />
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

        <!-- Compose Tweet Modal -->
        <Dialog :open="isComposing" @update:open="isComposing = $event">
            <DialogContent
                class="max-w-xl sm:max-w-2xl rounded-2xl p-0 overflow-hidden border-0 bg-white dark:bg-gray-900 shadow-xl"
            >
                <div class="absolute top-3 left-3 z-10">
                    <DialogClose asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            class="rounded-full w-9 h-9 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                            @click="closeComposer"
                        >
                            <X class="h-5 w-5" />
                        </Button>
                    </DialogClose>
                </div>
                <div class="pt-12 px-2">
                    <ComposeTweet isModal @tweet-posted="handleTweetPosted" @close="closeComposer" />
                </div>
            </DialogContent>
        </Dialog>
    </div>
</template>
