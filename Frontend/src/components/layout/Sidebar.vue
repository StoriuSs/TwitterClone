<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import Button from '@/components/ui/button/Button.vue'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Home, Search, Bell, Mail, Bookmark, User, MoreHorizontal } from 'lucide-vue-next'

const props = defineProps<{
    openComposer: () => void
    activePage?: string
}>()

// Default to home if no active page is provided
const activePage = computed(() => props.activePage || 'home')

const router = useRouter()
const authStore = useAuthStore()

const currentUser = computed(() => {
    return (
        authStore.user || {
            name: 'User',
            username: 'user',
            avatar: 'https://placehold.co/400',
            verified: true
        }
    )
})

const handleLogout = async () => {
    await authStore.logout()
    router.push('/signup')
}
</script>

<template>
    <aside
        class="h-screen overflow-auto border-r border-gray-200 dark:border-gray-800 z-10 bg-white dark:bg-black w-[68px] sm:w-[68px] md:w-[88px] lg:w-[240px] shrink-0 fixed sm:fixed md:fixed lg:static left-0 top-0 max-[420px]:h-[60px] max-[420px]:w-full max-[420px]:border-t max-[420px]:border-r-0 max-[420px]:bottom-0 max-[420px]:top-auto max-[420px]:left-0"
    >
        <div
            class="h-full flex flex-col items-center lg:items-start p-2 max-[420px]:flex-row max-[420px]:justify-around"
        >
            <!-- Logo (hidden on smallest screens) -->
            <div class="flex items-center justify-center lg:justify-start mb-6 mt-2 px-1 max-[420px]:hidden">
                <svg class="w-7 h-7 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                    <path
                        d="M23.643 4.937c-.835.37-1.732.62-2.675.733.962-.576 1.7-1.49 2.048-2.578-.9.534-1.897.922-2.958 1.13-.85-.904-2.06-1.47-3.4-1.47-2.572 0-4.658 2.086-4.658 4.66 0 .364.042.718.12 1.06-3.873-.195-7.304-2.05-9.602-4.868-.4.69-.63 1.49-.63 2.342 0 1.616.823 3.043 2.072 3.878-.764-.025-1.482-.234-2.11-.583v.06c0 2.257 1.605 4.14 3.737 4.568-.392.106-.803.162-1.227.162-.3 0-.593-.028-.877-.082.593 1.85 2.313 3.198 4.352 3.234-1.595 1.25-3.604 1.995-5.786 1.995-.376 0-.747-.022-1.112-.065 2.062 1.323 4.51 2.093 7.14 2.093 8.57 0 13.255-7.098 13.255-13.254 0-.2-.005-.402-.014-.602.91-.658 1.7-1.477 2.323-2.41z"
                    ></path>
                </svg>
                <span class="ml-2 text-xl font-bold hidden lg:block">Kwitter</span>
            </div>

            <!-- Navigation -->
            <nav class="space-y-2 w-full max-[420px]:flex max-[420px]:space-y-0 max-[420px]:justify-around">
                <router-link
                    to="/"
                    :class="[
                        'flex items-center justify-center lg:justify-start p-3 rounded-full w-[56px] lg:w-full mx-auto lg:mx-0 max-[420px]:p-2',
                        activePage === 'home'
                            ? 'font-bold bg-gray-200/20 dark:bg-gray-800/40'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                    ]"
                >
                    <Home class="w-[26px] h-[26px]" :class="{ 'text-blue-500': activePage === 'home' }" />
                    <span
                        class="ml-5 font-medium text-xl hidden lg:block"
                        :class="{ 'font-bold': activePage === 'home' }"
                        >Home</span
                    >
                </router-link>
                <a
                    href="#"
                    :class="[
                        'flex items-center justify-center lg:justify-start p-3 rounded-full w-[56px] lg:w-full mx-auto lg:mx-0',
                        activePage === 'explore'
                            ? 'font-bold bg-gray-200/20 dark:bg-gray-800/40'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                    ]"
                >
                    <Search class="w-[26px] h-[26px]" :class="{ 'text-blue-500': activePage === 'explore' }" />
                    <span
                        class="ml-5 font-medium text-xl hidden lg:block"
                        :class="{ 'font-bold': activePage === 'explore' }"
                        >Explore</span
                    >
                </a>
                <a
                    href="#"
                    :class="[
                        'flex items-center justify-center lg:justify-start p-3 rounded-full w-[56px] lg:w-full mx-auto lg:mx-0 relative',
                        activePage === 'notifications'
                            ? 'font-bold bg-gray-200/20 dark:bg-gray-800/40'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                    ]"
                >
                    <Bell class="w-[26px] h-[26px]" :class="{ 'text-blue-500': activePage === 'notifications' }" />
                    <span class="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full lg:hidden"></span>
                    <span
                        class="ml-5 font-medium text-xl hidden lg:block"
                        :class="{ 'font-bold': activePage === 'notifications' }"
                        >Notifications</span
                    >
                </a>
                <a
                    href="#"
                    :class="[
                        'flex items-center justify-center lg:justify-start p-3 rounded-full w-[56px] lg:w-full mx-auto lg:mx-0',
                        activePage === 'messages'
                            ? 'font-bold bg-gray-200/20 dark:bg-gray-800/40'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                    ]"
                >
                    <Mail class="w-[26px] h-[26px]" :class="{ 'text-blue-500': activePage === 'messages' }" />
                    <span
                        class="ml-5 font-medium text-xl hidden lg:block"
                        :class="{ 'font-bold': activePage === 'messages' }"
                        >Messages</span
                    >
                </a>
                <a
                    href="#"
                    :class="[
                        'flex items-center justify-center lg:justify-start p-3 rounded-full w-[56px] lg:w-full mx-auto lg:mx-0',
                        activePage === 'bookmarks'
                            ? 'font-bold bg-gray-200/20 dark:bg-gray-800/40'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                    ]"
                >
                    <Bookmark class="w-[26px] h-[26px]" :class="{ 'text-blue-500': activePage === 'bookmarks' }" />
                    <span
                        class="ml-5 font-medium text-xl hidden lg:block"
                        :class="{ 'font-bold': activePage === 'bookmarks' }"
                        >Bookmarks</span
                    >
                </a>
                <router-link
                    :to="currentUser.username ? `/profile/${currentUser.username}` : '#'"
                    :class="[
                        'flex items-center justify-center lg:justify-start p-3 rounded-full w-[56px] lg:w-full mx-auto lg:mx-0',
                        activePage === 'profile'
                            ? 'font-bold bg-gray-200/20 dark:bg-gray-800/40'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                    ]"
                >
                    <User class="w-[26px] h-[26px]" :class="{ 'text-blue-500': activePage === 'profile' }" />
                    <span
                        class="ml-5 font-medium text-xl hidden lg:block"
                        :class="{ 'font-bold': activePage === 'profile' }"
                        >Profile</span
                    >
                </router-link>
                <a
                    href="#"
                    :class="[
                        'flex items-center justify-center lg:justify-start p-3 rounded-full w-[56px] lg:w-full mx-auto lg:mx-0',
                        activePage === 'more'
                            ? 'font-bold bg-gray-200/20 dark:bg-gray-800/40'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                    ]"
                >
                    <MoreHorizontal class="w-[26px] h-[26px]" :class="{ 'text-blue-500': activePage === 'more' }" />
                    <span
                        class="ml-5 font-medium text-xl hidden lg:block"
                        :class="{ 'font-bold': activePage === 'more' }"
                        >More</span
                    >
                </a>
            </nav>

            <!-- Tweet Button (hidden on smallest screens) -->
            <div class="mt-5 w-full max-[420px]:hidden">
                <Button
                    @click="props.openComposer"
                    variant="default"
                    class="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 rounded-full py-3 text-white font-bold flex items-center justify-center w-[56px] h-[56px] lg:w-full lg:h-auto mx-auto lg:mx-0"
                >
                    <svg
                        class="w-[26px] h-[26px] lg:hidden"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                    >
                        <path d="M12 5v14M5 12h14"></path>
                    </svg>
                    <span class="hidden lg:block text-xl">Tweet</span>
                </Button>
            </div>

            <!-- User Profile (hidden on smallest screens) -->
            <div class="mt-auto mb-4 pt-4 w-full max-[420px]:hidden">
                <div
                    @click="handleLogout"
                    class="flex items-center justify-center lg:justify-between p-2 w-[56px] lg:w-full mx-auto lg:mx-0 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                >
                    <Avatar class="w-[38px] h-[38px]">
                        <AvatarImage :src="currentUser.avatar || 'https://placehold.co/400'" alt="Profile" />
                        <AvatarFallback>{{ currentUser.name.charAt(0) }}</AvatarFallback>
                    </Avatar>
                    <div class="ml-3 hidden lg:block">
                        <p class="font-bold text-base">{{ currentUser.name }}</p>
                        <p class="text-gray-500 dark:text-gray-400 text-sm">@{{ currentUser.username }}</p>
                    </div>
                    <MoreHorizontal class="ml-auto w-5 h-5 hidden lg:block text-gray-500" />
                </div>
            </div>
        </div>
    </aside>
</template>
