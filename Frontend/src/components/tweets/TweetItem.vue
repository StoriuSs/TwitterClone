<script setup lang="ts">
import { Heart, MessageCircle, MoreHorizontal, Repeat, Share, Bookmark } from 'lucide-vue-next'
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
                        <span v-if="tweet.user?.verify" class="ml-1 text-blue-500">
                            <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                <path
                                    d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.437.695.21 1.04z"
                                ></path>
                            </svg>
                        </span>
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
                    <button
                        @click="handleLike"
                        class="group flex items-center text-gray-500 dark:text-gray-400 hover:text-blue-500 transition-colors"
                    >
                        <div
                            class="p-2 rounded-full group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 transition-colors"
                        >
                            <MessageCircle class="w-5 h-5" />
                        </div>
                        <span class="ml-1 text-sm">{{ tweet.stats?.replies || 0 }}</span>
                    </button>
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
                    <button
                        @click="handleBookmark"
                        class="group flex items-center"
                        :class="isBookmarked ? 'text-blue-500' : 'text-gray-500 dark:text-gray-400 hover:text-blue-500'"
                    >
                        <div
                            class="p-2 rounded-full group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 transition-colors"
                        >
                            <Share class="w-5 h-5" />
                        </div>
                        <span class="ml-1 text-sm">{{ tweet.stats?.views || 0 }}</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>
