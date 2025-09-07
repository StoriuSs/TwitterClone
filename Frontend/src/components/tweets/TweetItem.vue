<script setup lang="ts">
import { Heart, MessageCircle, MoreHorizontal, Repeat, Eye, Bookmark } from 'lucide-vue-next'
import { ref } from 'vue'
import type { TweetType } from '@/interfaces/tweet.interface'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

const props = defineProps<{
    tweet: TweetType
}>()

const emit = defineEmits(['like', 'retweet', 'reply', 'share', 'bookmark'])

const isLiked = ref(false)
const isRetweeted = ref(false)
const isBookmarked = ref(false)

const formatDate = (date: string) => {
    const tweetDate = new Date(date)
    const now = new Date()

    // If the tweet is from today, show the time
    if (tweetDate.toDateString() === now.toDateString()) {
        return tweetDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    // If the tweet is from this year, show the month and day
    if (tweetDate.getFullYear() === now.getFullYear()) {
        return tweetDate.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }

    // Otherwise show the full date
    return tweetDate.toLocaleDateString()
}

const handleLike = () => {
    isLiked.value = !isLiked.value
    emit('like', props.tweet._id, isLiked.value)
}

const handleRetweet = () => {
    isRetweeted.value = !isRetweeted.value
    emit('retweet', props.tweet._id, isRetweeted.value)
}

const handleBookmark = () => {
    isBookmarked.value = !isBookmarked.value
    emit('bookmark', props.tweet._id, isBookmarked.value)
}
</script>

<template>
    <div
        class="border-b border-gray-200 dark:border-gray-800 p-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors duration-200 cursor-pointer"
    >
        <div class="flex max-w-4xl mx-auto">
            <div class="flex-shrink-0">
                <Avatar class="w-12 h-12 hover:opacity-90 transition-opacity">
                    <AvatarImage :src="tweet.user?.avatar || 'https://placehold.co/400?text=User'" alt="Profile" />
                    <AvatarFallback>{{ tweet.user?.name?.[0] || 'U' }}</AvatarFallback>
                </Avatar>
            </div>
            <div class="ml-3 flex-1">
                <div class="flex items-center">
                    <div>
                        <span class="font-bold hover:underline">{{ tweet.user?.name }}</span>
                    </div>
                    <div class="flex text-gray-500 dark:text-gray-400 ml-1">
                        <span class="hover:underline">@{{ tweet.user?.username }}</span>
                        <span v-if="tweet.created_at" class="mx-1">·</span>
                        <span
                            v-if="tweet.created_at"
                            class="hover:underline"
                            :title="new Date(tweet.created_at).toLocaleString()"
                        >
                            {{ formatDate(tweet.created_at) }}
                        </span>
                    </div>
                    <div class="ml-auto relative">
                        <button class="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
                            <MoreHorizontal class="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        </button>
                    </div>
                </div>
                <div class="mt-2">
                    <p class="text-lg leading-relaxed whitespace-pre-line">{{ tweet.content }}</p>
                    <div v-if="tweet.medias && tweet.medias.length > 0" class="mt-3">
                        <!-- Single image full width -->
                        <div v-if="tweet.medias.length === 1" class="rounded-2xl overflow-hidden">
                            <img
                                v-if="tweet.medias[0].type === 'image'"
                                :src="tweet.medias[0].url"
                                alt="Tweet image"
                                class="w-full max-h-[500px] object-cover hover:opacity-95 transition-opacity"
                                loading="lazy"
                            />
                            <!-- Video player could be implemented here -->
                        </div>

                        <!-- Multiple images grid -->
                        <div v-else-if="tweet.medias.length > 1" class="grid gap-2 mt-2">
                            <div
                                :class="[
                                    'grid',
                                    tweet.medias.length === 2 ? 'grid-cols-2' : 'grid-cols-2',
                                    tweet.medias.length >= 4 ? 'grid-rows-2' : '',
                                    'gap-2',
                                    'rounded-2xl overflow-hidden'
                                ]"
                            >
                                <template v-for="(media, index) in tweet.medias.slice(0, 4)" :key="index">
                                    <div
                                        :class="[
                                            'overflow-hidden',
                                            tweet.medias.length === 3 && index === 0 ? 'col-span-2' : '',
                                            'rounded-none'
                                        ]"
                                    >
                                        <img
                                            v-if="media.type === 'image'"
                                            :src="media.url"
                                            alt="Tweet image"
                                            class="w-full h-full object-cover hover:opacity-95 transition-opacity"
                                            loading="lazy"
                                        />
                                    </div>
                                </template>
                                <div v-if="tweet.medias.length > 4" class="relative col-start-2 row-start-2">
                                    <div class="absolute inset-0 bg-black/40 flex items-center justify-center">
                                        <span class="text-white text-lg font-bold">+{{ tweet.medias.length - 3 }}</span>
                                    </div>
                                    <img
                                        v-if="tweet.medias[3].type === 'image'"
                                        :src="tweet.medias[3].url"
                                        alt="Tweet image"
                                        class="w-full h-full object-cover"
                                        loading="lazy"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="mt-4 flex justify-between max-w-lg">
                    <!-- Reply -->
                    <button
                        class="group flex items-center text-gray-500 dark:text-gray-400 hover:text-blue-500 transition-colors"
                    >
                        <div
                            class="p-2 rounded-full group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 transition-colors"
                        >
                            <MessageCircle class="w-5 h-5" />
                        </div>
                        <span class="ml-1 text-sm">{{ tweet.stats?.replies || 0 }}</span>
                    </button>
                    <!-- Retweet -->
                    <button
                        @click="handleRetweet"
                        class="group flex items-center"
                        :class="
                            isRetweeted ? 'text-green-500' : 'text-gray-500 dark:text-gray-400 hover:text-green-500'
                        "
                    >
                        <div
                            class="p-2 rounded-full"
                            :class="
                                isRetweeted
                                    ? 'bg-green-50 dark:bg-green-900/30'
                                    : 'group-hover:bg-green-50 dark:group-hover:bg-green-900/30'
                            "
                        >
                            <Repeat class="w-5 h-5" />
                        </div>
                        <span class="ml-1 text-sm">{{ tweet.stats?.retweets || 0 }}</span>
                    </button>
                    <!-- Like -->
                    <button
                        @click="handleLike"
                        class="group flex items-center"
                        :class="isLiked ? 'text-red-500' : 'text-gray-500 dark:text-gray-400 hover:text-red-500'"
                    >
                        <div
                            class="p-2 rounded-full transition-colors"
                            :class="
                                isLiked
                                    ? 'bg-red-50 dark:bg-red-900/30'
                                    : 'group-hover:bg-red-50 dark:group-hover:bg-red-900/30'
                            "
                        >
                            <Heart class="w-5 h-5" :class="isLiked ? 'fill-red-500' : ''" />
                        </div>
                        <span class="ml-1 text-sm">{{
                            isLiked ? (tweet.stats?.likes || 0) + 1 : tweet.stats?.likes || 0
                        }}</span>
                    </button>
                    <!-- Bookmark -->
                    <button
                        @click="handleBookmark"
                        class="group flex items-center"
                        :class="
                            isBookmarked ? 'text-yellow-500' : 'text-gray-500 dark:text-gray-400 hover:text-yellow-500'
                        "
                    >
                        <div
                            class="p-2 rounded-full transition-colors"
                            :class="
                                isBookmarked
                                    ? 'bg-yellow-50 dark:bg-yellow-900/30'
                                    : 'group-hover:bg-yellow-50 dark:group-hover:bg-yellow-900/30'
                            "
                        >
                            <Bookmark class="w-5 h-5" :class="isBookmarked ? 'fill-yellow-500' : ''" />
                        </div>
                    </button>
                    <!-- Views -->
                    <button
                        class="group flex items-center text-gray-500 dark:text-gray-400 hover:text-blue-500 transition-colors"
                        style="cursor: default"
                        tabindex="-1"
                    >
                        <div
                            class="p-2 rounded-full group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 transition-colors"
                        >
                            <Eye class="w-5 h-5" />
                        </div>
                        <span class="ml-1 text-sm">{{ tweet.stats?.views || 0 }}</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>
