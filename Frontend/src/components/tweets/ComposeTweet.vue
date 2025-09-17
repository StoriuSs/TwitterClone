<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useTweetsStore } from '@/stores/tweets'
import { showSuccessToast, showErrorToast } from '@/utils/toast'
import Button from '@/components/ui/button/Button.vue'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Image, Smile, Calendar, MapPin } from 'lucide-vue-next'

const props = defineProps<{
    isModal?: boolean
    closeModal?: () => void
}>()

const emit = defineEmits<{
    (e: 'tweetPosted'): void
}>()

const authStore = useAuthStore()
const tweetsStore = useTweetsStore()

const tweetContent = ref('')
const isPosting = ref(false)
const selectedImages = ref<File[]>([])
const imageURLs = ref<string[]>([])
const MAX_CHARS = 280

// Auto-resize textarea
const textarea = ref<HTMLTextAreaElement | null>(null)
const resizeTextarea = () => {
    if (textarea.value) {
        textarea.value.style.height = 'auto'
        textarea.value.style.height = `${textarea.value.scrollHeight}px`
    }
}

watch(tweetContent, () => {
    resizeTextarea()
})

const currentUser = computed(() => {
    return (
        authStore.user || {
            name: 'User',
            username: 'user',
            avatar: 'https://placehold.co/400',
            verify: 0
        }
    )
})

const charCount = computed(() => {
    return tweetContent.value.length
})

const charCountColor = computed(() => {
    if (charCount.value > MAX_CHARS * 0.9) {
        return 'text-red-500'
    }
    if (charCount.value > MAX_CHARS * 0.8) {
        return 'text-yellow-500'
    }
    return 'text-gray-500 dark:text-gray-400'
})

// const isDisabled = computed(() => {
//     return !tweetContent.value.trim() || charCount.value > MAX_CHARS || isPosting.value
// })

const handleImageUpload = (event: Event) => {
    const input = event.target as HTMLInputElement
    if (input.files && input.files.length > 0) {
        const files = Array.from(input.files)
        selectedImages.value = [...selectedImages.value, ...files].slice(0, 4) // Max 4 images

        // Create URLs for preview
        files.forEach((file) => {
            const url = URL.createObjectURL(file)
            imageURLs.value.push(url)
        })
    }
}

const removeImage = (index: number) => {
    URL.revokeObjectURL(imageURLs.value[index])
    imageURLs.value.splice(index, 1)
    selectedImages.value.splice(index, 1)
}

const postTweet = async () => {
    if (tweetContent.value.trim() && charCount.value <= MAX_CHARS) {
        isPosting.value = true

        // Extract hashtags and mentions
        const hashtags = tweetContent.value.match(/#[\w]+/g) || []
        const processedHashtags = hashtags.map((tag) => tag.substring(1))

        const mentions = tweetContent.value.match(/@[\w]+/g) || []
        const processedMentions = mentions.map((mention) => mention.substring(1))

        try {
            // In a real implementation, you would upload images first then attach them to the tweet
            // This is a simplified version
            let mediaIds: string[] = []

            if (selectedImages.value.length > 0) {
                // This would be replaced with actual image upload to your backend
                // For now, just simulating the process
                console.log(`Uploading ${selectedImages.value.length} images...`)
                // Simulated media IDs
                mediaIds = selectedImages.value.map((_, i) => `image_${Date.now()}_${i}`)
            }

            const result = await tweetsStore.createTweet({
                content: tweetContent.value,
                hashtags: processedHashtags,
                mentions: processedMentions,
                medias: mediaIds,
                type: 0, // Normal tweet type
                audience: 0 // Everyone
            })

            if (result.success) {
                // Reset form
                tweetContent.value = ''
                selectedImages.value = []
                imageURLs.value.forEach((url) => URL.revokeObjectURL(url))
                imageURLs.value = []

                if (props.closeModal) {
                    props.closeModal()
                }

                emit('tweetPosted')

                // Show success toast AFTER everything is complete
                showSuccessToast(result.message || 'Tweet created successfully')
            } else {
                // Show error toast
                showErrorToast(result.error || 'Failed to post tweet')
            }
        } catch (error) {
            console.error('Error posting tweet:', error)
        } finally {
            isPosting.value = false
        }
    }
}
</script>

<template>
    <div class="flex max-w-4xl mx-auto" :class="{ 'p-5': !isModal, 'px-4 py-3': isModal }">
        <div class="flex-shrink-0">
            <Avatar class="w-12 h-12">
                <AvatarImage :src="currentUser.avatar || 'https://placehold.co/400'" alt="Profile" />
                <AvatarFallback
                    class="bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-200 text-lg font-medium"
                >
                    {{ currentUser.name.charAt(0) }}
                </AvatarFallback>
            </Avatar>
        </div>
        <div class="ml-4 flex-1">
            <div class="mb-2">
                <button
                    class="inline-flex items-center px-3 py-1 rounded-full border border-blue-400 text-blue-500 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                >
                    <span class="mr-1">Everyone</span>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="feather feather-chevron-down"
                    >
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </button>
            </div>

            <!-- Tweet input -->
            <textarea
                ref="textarea"
                v-model="tweetContent"
                placeholder="What's happening?"
                class="w-full bg-transparent border-none outline-none text-xl resize-none leading-relaxed mb-2 placeholder-gray-500 dark:placeholder-gray-400 font-normal"
                :class="{ 'min-h-[80px]': !isModal, 'min-h-[140px]': isModal }"
                :autofocus="isModal"
            ></textarea>

            <!-- Image previews -->
            <div v-if="imageURLs.length > 0" class="mt-2 mb-4">
                <div class="grid grid-cols-2 gap-2">
                    <div v-for="(url, index) in imageURLs" :key="index" class="relative">
                        <img :src="url" class="rounded-lg w-full h-32 object-cover" />
                        <button
                            @click="removeImage(index)"
                            class="absolute top-1 right-1 bg-black bg-opacity-50 rounded-full p-1 text-white hover:bg-opacity-70"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            >
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Divider -->
            <div class="border-t border-gray-200 dark:border-gray-800 my-3"></div>

            <div class="flex items-center justify-between">
                <!-- Media buttons -->
                <div class="flex space-x-2 text-blue-500">
                    <!-- Image upload button with hidden input -->
                    <label
                        class="p-2 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/40 cursor-pointer transition-colors"
                    >
                        <Image class="w-5 h-5" />
                        <input type="file" multiple accept="image/*" class="hidden" @change="handleImageUpload" />
                    </label>
                    <button class="p-2 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
                        <Smile class="w-5 h-5" />
                    </button>
                    <button class="p-2 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
                        <Calendar class="w-5 h-5" />
                    </button>
                    <button class="p-2 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
                        <MapPin class="w-5 h-5" />
                    </button>
                </div>

                <div class="flex items-center gap-3">
                    <!-- Character counter -->
                    <div v-if="charCount > 0" class="flex items-center">
                        <div class="w-8 h-8 relative">
                            <svg class="w-full h-full" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10" fill="none" stroke="#E1E8ED" stroke-width="2"></circle>
                                <circle
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    fill="none"
                                    :stroke="
                                        charCount > MAX_CHARS * 0.9
                                            ? '#F4212E'
                                            : charCount > MAX_CHARS * 0.8
                                              ? '#FFAD1F'
                                              : '#1D9BF0'
                                    "
                                    stroke-width="2"
                                    :stroke-dasharray="`${Math.min((charCount / MAX_CHARS) * 62.83, 62.83)} 62.83`"
                                    stroke-linecap="round"
                                    transform="rotate(-90, 12, 12)"
                                ></circle>
                            </svg>
                            <span
                                v-if="charCount > MAX_CHARS * 0.8"
                                class="absolute inset-0 flex items-center justify-center text-xs font-bold"
                                :class="charCountColor"
                            >
                                {{ MAX_CHARS - charCount }}
                            </span>
                        </div>
                    </div>

                    <!-- Tweet button -->
                    <Button
                        @click="postTweet"
                        variant="default"
                        class="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 rounded-full px-6 py-2.5 text-white font-bold text-base transition-all shadow-sm"
                        :disabled="!tweetContent.trim() || charCount > MAX_CHARS || isPosting"
                        :class="{
                            'opacity-50 cursor-not-allowed': !tweetContent.trim() || charCount > MAX_CHARS || isPosting
                        }"
                    >
                        {{ isPosting ? 'Posting...' : 'Tweet' }}
                    </Button>
                </div>
            </div>
        </div>
    </div>
</template>
