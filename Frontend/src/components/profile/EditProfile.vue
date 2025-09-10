<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { X, Camera, Loader2 } from 'lucide-vue-next'
import { Dialog, DialogContent, DialogHeader, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import type { UpdateProfileDataType } from '@/interfaces/auth.interface'
import api from '@/lib/api'

const props = defineProps<{
    isOpen: boolean
}>()

const emit = defineEmits<{
    close: []
    updated: []
}>()

const authStore = useAuthStore()

// Form data
const formData = ref<UpdateProfileDataType>({
    name: authStore.user?.name || '',
    username: authStore.user?.username || '',
    bio: authStore.user?.bio || '',
    location: authStore.user?.location || '',
    website: authStore.user?.website || '',
    avatar: authStore.user?.avatar || '',
    cover_photo: authStore.user?.cover_photo || ''
})

// Loading states
const isUploadingAvatar = ref(false)
const isUploadingCover = ref(false)

const isSaving = ref(false)
const errors = ref<Record<string, string>>({})

// Validation
const isFormValid = computed(() => {
    return formData.value.name && formData.value.name.trim().length > 0
})

const validateField = (field: string, value: string) => {
    const fieldErrors: Record<string, string> = {}

    // Name validation - required, 2-100 characters
    if (field === 'name') {
        if (!value || value.trim().length === 0) {
            fieldErrors.name = 'Name is required'
        } else if (value.length < 2 || value.length > 100) {
            fieldErrors.name = 'Name must be between 2 and 100 characters long'
        }
    }

    // Username validation - 4-15 characters, letters/numbers/underscores, cannot start with number
    if (field === 'username' && value) {
        if (value.length < 4 || value.length > 15) {
            fieldErrors.username = 'Username must be between 4 and 15 characters long'
        } else if (!/^(?![0-9])[a-zA-Z0-9._]{4,15}$/.test(value)) {
            fieldErrors.username =
                'Username can only contain letters, numbers, dots, and underscores, and cannot start with a number'
        }
    }

    // Website validation - must be valid URL
    if (field === 'website' && value) {
        try {
            new URL(value.startsWith('http') ? value : `https://${value}`)
        } catch {
            fieldErrors.website = 'Website must be a valid URL'
        }
    }

    // Bio validation - max 500 characters
    if (field === 'bio' && value && value.length > 500) {
        fieldErrors.bio = 'Bio must be between 0 and 500 characters long'
    }

    // Location validation - max 100 characters
    if (field === 'location' && value && value.length > 100) {
        fieldErrors.location = 'Location must be between 0 and 100 characters long'
    }

    return fieldErrors
}

const handleInput = (field: string, value: string) => {
    formData.value[field as keyof UpdateProfileDataType] = value

    // Clear existing error for this field
    delete errors.value[field]

    // Validate field
    const fieldErrors = validateField(field, value)
    errors.value = { ...errors.value, ...fieldErrors }
}

const handleSubmit = async () => {
    if (!isFormValid.value || isSaving.value) return

    // Validate all fields
    let allErrors: Record<string, string> = {}
    Object.entries(formData.value).forEach(([field, value]) => {
        if (value) {
            const fieldErrors = validateField(field, value)
            allErrors = { ...allErrors, ...fieldErrors }
        }
    })

    errors.value = allErrors

    if (Object.keys(allErrors).length > 0) return

    isSaving.value = true

    try {
        // Create payload with only changed fields (excluding empty strings)
        const payload: UpdateProfileDataType = {}

        Object.entries(formData.value).forEach(([key, value]) => {
            if (value && value.trim() !== '') {
                if (key === 'website' && value && !value.startsWith('http')) {
                    payload[key as keyof UpdateProfileDataType] = `https://${value}`
                } else {
                    payload[key as keyof UpdateProfileDataType] = value.trim()
                }
            }
        })

        // Always include name as it's required
        if (!payload.name) {
            payload.name = formData.value.name?.trim() || ''
        }

        console.log('Auth store methods:', Object.getOwnPropertyNames(authStore))
        console.log('updateProfile method exists:', typeof authStore.updateProfile)

        const result = await authStore.updateProfile(payload)

        if (result.success) {
            emit('updated')
            emit('close')
        }
    } catch (error) {
        console.error('Failed to update profile:', error)
    } finally {
        isSaving.value = false
    }
}

const handleClose = () => {
    if (!isSaving.value) {
        emit('close')
    }
}

const handleImageUpload = (type: 'avatar' | 'cover') => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'

    input.onchange = async (event) => {
        const file = (event.target as HTMLInputElement).files?.[0]
        if (!file) return

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('File size must be less than 5MB')
            return
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file')
            return
        }

        // Set loading state
        if (type === 'avatar') {
            isUploadingAvatar.value = true
        } else {
            isUploadingCover.value = true
        }

        try {
            const uploadFormData = new FormData()
            uploadFormData.append('image', file)

            const response = await api.post('/medias/upload-image', uploadFormData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            })

            if (!response.data) {
                throw new Error('Upload failed')
            }

            const data = response.data
            const imageUrl = data.result[0]?.url

            if (!imageUrl) {
                throw new Error('Invalid response from server')
            }

            // Update form data
            if (type === 'avatar') {
                formData.value.avatar = imageUrl
            } else {
                formData.value.cover_photo = imageUrl
            }
        } catch (error) {
            console.error('Image upload error:', error)
            let errorMessage = 'Failed to upload image. Please try again.'

            // Check for specific error types
            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as { response?: { data?: { message?: string } } }
                if (axiosError.response?.data?.message) {
                    errorMessage = axiosError.response.data.message
                }
            } else if (error && typeof error === 'object' && 'message' in error) {
                const errorWithMessage = error as { message: string }
                if (
                    errorWithMessage.message.includes('maxTotalFileSize') ||
                    errorWithMessage.message.includes('maxFileSize')
                ) {
                    errorMessage = 'Image file is too large. Please choose a smaller image (max 5MB).'
                } else if (errorWithMessage.message.includes('Invalid file type')) {
                    errorMessage = 'Invalid file type. Please choose a valid image file.'
                } else {
                    errorMessage = errorWithMessage.message
                }
            }

            alert(errorMessage)
        } finally {
            // Clear loading state
            if (type === 'avatar') {
                isUploadingAvatar.value = false
            } else {
                isUploadingCover.value = false
            }
        }
    }

    input.click()
}

// Initialize form when user changes
const initializeForm = () => {
    formData.value = {
        name: authStore.user?.name || '',
        username: authStore.user?.username || '',
        bio: authStore.user?.bio || '',
        location: authStore.user?.location || '',
        website: authStore.user?.website || '',
        avatar: authStore.user?.avatar || '',
        cover_photo: authStore.user?.cover_photo || ''
    }
    errors.value = {}
}

// Watch for user changes and reinitialize form
import { watch } from 'vue'
watch(() => authStore.user, initializeForm, { immediate: true })
</script>

<template>
    <Dialog :open="props.isOpen" @update:open="(open) => !open && handleClose()">
        <DialogContent class="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-4">
                        <DialogClose @click="handleClose" :disabled="isSaving">
                            <X class="w-5 h-5" />
                        </DialogClose>
                        <h2 class="text-xl font-bold">Edit profile</h2>
                    </div>
                    <Button
                        @click="handleSubmit"
                        :disabled="!isFormValid || isSaving"
                        class="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 rounded-full px-6"
                    >
                        {{ isSaving ? 'Saving...' : 'Save' }}
                    </Button>
                </div>
            </DialogHeader>

            <div class="space-y-6 p-4">
                <!-- Cover Photo -->
                <div class="relative">
                    <div class="h-32 bg-gray-300 dark:bg-gray-700 rounded-lg overflow-hidden relative">
                        <img
                            v-if="formData.cover_photo"
                            :src="formData.cover_photo"
                            alt="Cover photo"
                            class="w-full h-full object-cover"
                        />
                        <button
                            @click="handleImageUpload('cover')"
                            :disabled="isUploadingCover"
                            class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity disabled:opacity-100"
                        >
                            <Loader2 v-if="isUploadingCover" class="w-6 h-6 text-white animate-spin" />
                            <Camera v-else class="w-6 h-6 text-white" />
                        </button>
                    </div>

                    <!-- Profile Picture -->
                    <div class="absolute -bottom-8 left-4">
                        <div class="relative">
                            <Avatar class="w-16 h-16 border-4 border-white dark:border-black">
                                <AvatarImage :src="formData.avatar || ''" :alt="formData.name" />
                                <AvatarFallback class="text-lg font-bold bg-gray-200 dark:bg-gray-700">
                                    {{ formData.name?.[0]?.toUpperCase() || 'U' }}
                                </AvatarFallback>
                            </Avatar>
                            <button
                                @click="handleImageUpload('avatar')"
                                :disabled="isUploadingAvatar"
                                class="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity disabled:opacity-100"
                            >
                                <Loader2 v-if="isUploadingAvatar" class="w-4 h-4 text-white animate-spin" />
                                <Camera v-else class="w-4 h-4 text-white" />
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Form Fields -->
                <div class="space-y-4 pt-8">
                    <!-- Name -->
                    <div>
                        <label class="block text-sm font-medium mb-2">Name</label>
                        <input
                            :value="formData.name"
                            @input="(e) => handleInput('name', (e.target as HTMLInputElement).value)"
                            type="text"
                            placeholder="Your name"
                            maxlength="50"
                            class="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                            :class="{ 'border-red-500': errors.name }"
                        />
                        <div class="flex justify-between items-center mt-1">
                            <p v-if="errors.name" class="text-red-500 text-sm">{{ errors.name }}</p>
                            <p class="text-gray-500 text-sm ml-auto">{{ formData.name?.length || 0 }}/50</p>
                        </div>
                    </div>

                    <!-- Username -->
                    <div>
                        <label class="block text-sm font-medium mb-2">Username</label>
                        <input
                            :value="formData.username"
                            @input="(e) => handleInput('username', (e.target as HTMLInputElement).value)"
                            type="text"
                            placeholder="username"
                            maxlength="15"
                            class="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                            :class="{ 'border-red-500': errors.username }"
                        />
                        <div class="flex justify-between items-center mt-1">
                            <p v-if="errors.username" class="text-red-500 text-sm">{{ errors.username }}</p>
                            <p class="text-gray-500 text-sm ml-auto">{{ formData.username?.length || 0 }}/15</p>
                        </div>
                    </div>

                    <!-- Bio -->
                    <div>
                        <label class="block text-sm font-medium mb-2">Bio</label>
                        <textarea
                            :value="formData.bio"
                            @input="(e) => handleInput('bio', (e.target as HTMLTextAreaElement).value)"
                            placeholder="Tell the world about yourself"
                            rows="3"
                            maxlength="500"
                            class="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white resize-none"
                            :class="{ 'border-red-500': errors.bio }"
                        />
                        <div class="flex justify-between items-center mt-1">
                            <p v-if="errors.bio" class="text-red-500 text-sm">{{ errors.bio }}</p>
                            <p class="text-gray-500 text-sm ml-auto">{{ formData.bio?.length || 0 }}/500</p>
                        </div>
                    </div>

                    <!-- Location -->
                    <div>
                        <label class="block text-sm font-medium mb-2">Location</label>
                        <input
                            :value="formData.location"
                            @input="(e) => handleInput('location', (e.target as HTMLInputElement).value)"
                            type="text"
                            placeholder="Where are you located?"
                            maxlength="100"
                            class="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                            :class="{ 'border-red-500': errors.location }"
                        />
                        <div class="flex justify-between items-center mt-1">
                            <p v-if="errors.location" class="text-red-500 text-sm">{{ errors.location }}</p>
                            <p class="text-gray-500 text-sm ml-auto">{{ formData.location?.length || 0 }}/100</p>
                        </div>
                    </div>

                    <!-- Website -->
                    <div>
                        <label class="block text-sm font-medium mb-2">Website</label>
                        <input
                            :value="formData.website"
                            @input="(e) => handleInput('website', (e.target as HTMLInputElement).value)"
                            type="text"
                            placeholder="your-website.com"
                            class="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                            :class="{ 'border-red-500': errors.website }"
                        />
                        <p v-if="errors.website" class="text-red-500 text-sm mt-1">{{ errors.website }}</p>
                    </div>
                </div>

                <!-- Error Message -->
                <div
                    v-if="authStore.error"
                    class="p-3 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-lg"
                >
                    <p class="text-red-700 dark:text-red-300 text-sm">{{ authStore.error }}</p>
                </div>
            </div>
        </DialogContent>
    </Dialog>
</template>
