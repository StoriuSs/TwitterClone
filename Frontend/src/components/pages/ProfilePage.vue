<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProfileStore } from '@/stores/profile'
import { useAuthStore } from '@/stores/auth'
import { ArrowLeft, Calendar, MapPin, Link as LinkIcon, MoreHorizontal } from 'lucide-vue-next'

import TweetItem from '@/components/tweets/TweetItem.vue'
import EditProfile from '@/components/profile/EditProfile.vue'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog'
import Spinner from '@/components/ui/Spinner.vue'

const route = useRoute()
const router = useRouter()
const profileStore = useProfileStore()
const authStore = useAuthStore()

const activeTab = ref('tweets') // Options: 'tweets', 'replies', 'media', 'likes'
const isLoadingTweets = ref(false)
const isEditingProfile = ref(false)
const showUnfollowModal = ref(false)
const isHoveringFollowButton = ref(false)

// Image preview modal
const showImagePreview = ref(false)
const previewImageUrl = ref('')
const previewImageAlt = ref('')

const username = computed(() => route.params.username as string)

const isOwnProfile = computed(() => {
    // Compare with both current auth user and URL username to handle username changes
    return authStore.user?.username === username.value || authStore.user?._id === profileStore.profile?._id
})

const formatDate = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long'
    })
}

const formatWebsite = (website: string) => {
    if (!website) return ''
    return website.replace(/^https?:\/\//, '')
}

const goBack = () => {
    window.history.back()
}

const handleFollow = async () => {
    if (!profileStore.profile) return

    if (profileStore.isFollowing) {
        // Show confirmation modal before unfollowing
        showUnfollowModal.value = true
    } else {
        await profileStore.followUser(profileStore.profile._id)
    }
}

const confirmUnfollow = async () => {
    if (!profileStore.profile) return

    showUnfollowModal.value = false
    await profileStore.unfollowUser(profileStore.profile._id)
}

const cancelUnfollow = () => {
    showUnfollowModal.value = false
}

const openEditProfile = () => {
    isEditingProfile.value = true
}

const closeEditProfile = () => {
    isEditingProfile.value = false
}

const handleProfileUpdated = async () => {
    // Close the edit modal first
    isEditingProfile.value = false

    // First update the auth store's user data to get the latest info
    await authStore.getUserInfo()

    // Check if username changed
    const currentUrlUsername = username.value
    const newUsername = authStore.user?.username

    if (newUsername && currentUrlUsername !== newUsername) {
        // Username changed, replace the current URL to avoid back button issues
        await router.replace(`/profile/${newUsername}`)
        await profileStore.fetchProfile(newUsername)
    } else {
        // Username didn't change, just refresh the profile data
        if (username.value) {
            await profileStore.fetchProfile(username.value)
        }
    }
}

// Handle the case where user navigates to an old username (possibly their own)
const handleProfileNotFound = async () => {
    if (authStore.user && authStore.user.username !== username.value) {
        // Replace the current URL with the user's current profile to avoid back button issues
        await router.replace(`/profile/${authStore.user.username}`)
    }
}

// Functions to handle image preview
const openImagePreview = (imageUrl: string, altText: string) => {
    previewImageUrl.value = imageUrl
    previewImageAlt.value = altText
    showImagePreview.value = true
}

const switchTab = async (tab: string) => {
    activeTab.value = tab

    if (tab === 'tweets' && profileStore.userTweets.length === 0) {
        isLoadingTweets.value = true
        await profileStore.fetchUserTweets(username.value)
        isLoadingTweets.value = false
    }
}

// Watch for username changes in the route
watch(username, async (newUsername, oldUsername) => {
    if (newUsername && newUsername !== oldUsername) {
        await profileStore.fetchProfile(newUsername)

        // If profile fetch failed and we have a logged-in user, check if this might be their old username
        if (profileStore.error) {
            await handleProfileNotFound()
            return
        }

        if (activeTab.value === 'tweets') {
            isLoadingTweets.value = true
            await profileStore.fetchUserTweets(newUsername)
            isLoadingTweets.value = false
        }
    }
})

onMounted(async () => {
    if (username.value) {
        await profileStore.fetchProfile(username.value)

        // If profile fetch failed and we have a logged-in user, check if this might be their old username
        if (profileStore.error) {
            await handleProfileNotFound()
            return
        }

        if (activeTab.value === 'tweets') {
            isLoadingTweets.value = true
            await profileStore.fetchUserTweets(username.value)
            isLoadingTweets.value = false
        }
    }
})
</script>

<template>
    <!-- Header -->
    <div
        class="sticky top-0 z-10 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800"
    >
        <div class="flex items-center gap-4 px-4 py-3">
            <button @click="goBack" class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <ArrowLeft class="w-5 h-5" />
            </button>
            <div class="flex-1">
                <h1 class="text-xl font-bold">
                    {{ profileStore.profile?.name || 'Profile' }}
                </h1>
                <p v-if="profileStore.profile" class="text-sm text-gray-500 dark:text-gray-400">
                    {{ profileStore.tweetsCount }} Tweets
                </p>
            </div>
        </div>
    </div>

    <!-- Loading State -->
    <div v-if="profileStore.loading && !profileStore.profile" class="flex justify-center items-center py-20">
        <Spinner />
    </div>

    <!-- Error State -->
    <div v-else-if="profileStore.error" class="p-6 text-center">
        <h2 class="text-xl font-bold mb-2">This account doesn't exist</h2>
        <p class="text-gray-500 dark:text-gray-400">Try searching for another.</p>
    </div>

    <!-- Profile Content -->
    <div v-else-if="profileStore.profile" class="pb-4">
        <!-- Cover Photo -->
        <div class="h-48 bg-gray-300 dark:bg-gray-700 relative">
            <img
                v-if="profileStore.profile.cover_photo"
                :src="profileStore.profile.cover_photo"
                :alt="`${profileStore.profile.name}'s cover`"
                class="w-full h-full object-cover cursor-pointer"
                @click="openImagePreview(profileStore.profile.cover_photo, `${profileStore.profile.name}'s cover`)"
            />
            <div class="absolute -bottom-16 left-4">
                <Avatar
                    class="w-32 h-32 border-4 border-white dark:border-black cursor-pointer"
                    @click="
                        profileStore.profile.avatar &&
                        openImagePreview(profileStore.profile.avatar, profileStore.profile.name)
                    "
                >
                    <AvatarImage :src="profileStore.profile.avatar || ''" :alt="profileStore.profile.name" />
                    <AvatarFallback class="text-2xl font-bold bg-gray-200 dark:bg-gray-700">
                        {{ profileStore.profile.name?.[0]?.toUpperCase() || 'U' }}
                    </AvatarFallback>
                </Avatar>
            </div>
        </div>

        <!-- Profile Info -->
        <div class="px-4 pt-4">
            <!-- Action Buttons -->
            <div class="flex justify-end mb-4">
                <div class="flex gap-2">
                    <Button variant="ghost" size="sm" class="p-2 rounded-full">
                        <MoreHorizontal class="w-5 h-5" />
                    </Button>

                    <!-- Follow/Edit Profile Button -->
                    <Button
                        v-if="!isOwnProfile"
                        @click="handleFollow"
                        @mouseenter="isHoveringFollowButton = true"
                        @mouseleave="isHoveringFollowButton = false"
                        :variant="profileStore.isFollowing ? 'outline' : 'default'"
                        :class="[
                            'rounded-full px-6 transition-colors',
                            profileStore.isFollowing && isHoveringFollowButton
                                ? 'border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-950'
                                : ''
                        ]"
                    >
                        {{ profileStore.isFollowing ? (isHoveringFollowButton ? 'Unfollow' : 'Following') : 'Follow' }}
                    </Button>

                    <Button v-else @click="openEditProfile" variant="outline" class="rounded-full px-6">
                        Edit profile
                    </Button>
                </div>
            </div>

            <!-- Name and Username -->
            <div class="mb-3">
                <h1 class="text-xl font-bold">{{ profileStore.profile.name }}</h1>
                <p class="text-gray-500 dark:text-gray-400">@{{ profileStore.profile.username }}</p>
            </div>

            <!-- Bio -->
            <div v-if="profileStore.profile.bio" class="mb-3">
                <p class="whitespace-pre-wrap">{{ profileStore.profile.bio }}</p>
            </div>

            <!-- Metadata -->
            <div class="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
                <div v-if="profileStore.profile.location" class="flex items-center gap-1">
                    <MapPin class="w-4 h-4" />
                    <span>{{ profileStore.profile.location }}</span>
                </div>

                <div v-if="profileStore.profile.website" class="flex items-center gap-1">
                    <LinkIcon class="w-4 h-4" />
                    <a
                        :href="profileStore.profile.website"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="text-blue-500 hover:underline"
                    >
                        {{ formatWebsite(profileStore.profile.website) }}
                    </a>
                </div>

                <div v-if="profileStore.profile.created_at" class="flex items-center gap-1">
                    <Calendar class="w-4 h-4" />
                    <span>Joined {{ formatDate(profileStore.profile.created_at) }}</span>
                </div>
            </div>

            <!-- Followers/Following Stats -->
            <div class="flex gap-4 text-sm mb-4">
                <div class="hover:underline cursor-pointer">
                    <span class="font-bold text-gray-900 dark:text-white">{{ profileStore.followingCount }}</span>
                    <span class="text-gray-500 dark:text-gray-400 ml-1">Following</span>
                </div>
                <div class="hover:underline cursor-pointer">
                    <span class="font-bold text-gray-900 dark:text-white">{{ profileStore.followersCount }}</span>
                    <span class="text-gray-500 dark:text-gray-400 ml-1">Followers</span>
                </div>
            </div>
        </div>

        <!-- Navigation Tabs -->
        <div class="border-b border-gray-200 dark:border-gray-800">
            <div class="flex">
                <button
                    @click="switchTab('tweets')"
                    class="flex-1 py-4 text-center font-medium relative hover:bg-gray-100 dark:hover:bg-gray-800"
                    :class="
                        activeTab === 'tweets' ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
                    "
                >
                    Tweets
                    <div
                        v-if="activeTab === 'tweets'"
                        class="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-14 h-1 bg-blue-500 rounded-full"
                    ></div>
                </button>

                <button
                    @click="switchTab('replies')"
                    class="flex-1 py-4 text-center font-medium relative hover:bg-gray-100 dark:hover:bg-gray-800"
                    :class="
                        activeTab === 'replies' ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
                    "
                >
                    Replies
                    <div
                        v-if="activeTab === 'replies'"
                        class="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-14 h-1 bg-blue-500 rounded-full"
                    ></div>
                </button>

                <button
                    @click="switchTab('media')"
                    class="flex-1 py-4 text-center font-medium relative hover:bg-gray-100 dark:hover:bg-gray-800"
                    :class="
                        activeTab === 'media' ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
                    "
                >
                    Media
                    <div
                        v-if="activeTab === 'media'"
                        class="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-14 h-1 bg-blue-500 rounded-full"
                    ></div>
                </button>

                <button
                    @click="switchTab('likes')"
                    class="flex-1 py-4 text-center font-medium relative hover:bg-gray-100 dark:hover:bg-gray-800"
                    :class="
                        activeTab === 'likes' ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
                    "
                >
                    Likes
                    <div
                        v-if="activeTab === 'likes'"
                        class="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-14 h-1 bg-blue-500 rounded-full"
                    ></div>
                </button>
            </div>
        </div>

        <!-- Tab Content -->
        <div>
            <!-- Tweets Tab -->
            <div v-if="activeTab === 'tweets'">
                <div v-if="isLoadingTweets" class="flex justify-center items-center py-10">
                    <Spinner />
                </div>

                <div v-else-if="profileStore.userTweets.length === 0" class="p-8 text-center">
                    <h3 class="text-xl font-bold mb-2">@{{ profileStore.profile.username }} hasn't tweeted</h3>
                    <p class="text-gray-500 dark:text-gray-400">When they do, their Tweets will show up here.</p>
                </div>

                <div v-else>
                    <TweetItem v-for="tweet in profileStore.userTweets" :key="tweet._id" :tweet="tweet" />
                </div>
            </div>

            <!-- Replies Tab -->
            <div v-else-if="activeTab === 'replies'" class="p-8 text-center">
                <h3 class="text-xl font-bold mb-2">@{{ profileStore.profile?.username }} hasn't replied yet</h3>
                <p class="text-gray-500 dark:text-gray-400">When they do, their replies will show up here.</p>
            </div>

            <!-- Media Tab -->
            <div v-else-if="activeTab === 'media'" class="p-8 text-center">
                <h3 class="text-xl font-bold mb-2">@{{ profileStore.profile?.username }} hasn't posted any media</h3>
                <p class="text-gray-500 dark:text-gray-400">When they share photos or videos, they'll show up here.</p>
            </div>

            <!-- Likes Tab -->
            <div v-else-if="activeTab === 'likes'" class="p-8 text-center">
                <h3 class="text-xl font-bold mb-2">@{{ profileStore.profile?.username }} hasn't liked any Tweets</h3>
                <p class="text-gray-500 dark:text-gray-400">When they do, those Tweets will show up here.</p>
            </div>
        </div>
    </div>

    <!-- Edit Profile Modal -->
    <EditProfile :is-open="isEditingProfile" @close="closeEditProfile" @updated="handleProfileUpdated" />

    <!-- Unfollow Confirmation Modal -->
    <Dialog :open="showUnfollowModal" @update:open="showUnfollowModal = $event">
        <DialogContent class="max-w-md">
            <DialogHeader>
                <DialogTitle class="text-xl font-bold"> Unfollow @{{ profileStore.profile?.username }}? </DialogTitle>
                <DialogDescription class="text-gray-600 dark:text-gray-400">
                    Their posts will no longer show up in your home timeline. You can still view their profile, unless
                    their posts are protected.
                </DialogDescription>
            </DialogHeader>
            <DialogFooter class="flex gap-2 mt-6">
                <Button @click="cancelUnfollow" variant="outline" class="flex-1"> Cancel </Button>
                <Button @click="confirmUnfollow" variant="destructive" class="flex-1"> Unfollow </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>

    <!-- Image Preview Modal -->
    <Dialog :open="showImagePreview" @update:open="showImagePreview = $event">
        <DialogContent class="max-w-7xl p-0 border-none bg-transparent shadow-none">
            <div class="flex items-center justify-center">
                <img :src="previewImageUrl" :alt="previewImageAlt" class="max-h-[90vh] max-w-full object-contain" />
            </div>
        </DialogContent>
    </Dialog>
</template>
