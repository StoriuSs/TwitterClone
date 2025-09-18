<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useSocketStore } from '@/stores/socket'
import { useAuthStore } from '@/stores/auth'
import Button from '@/components/ui/button/Button.vue'
import Input from '@/components/ui/input/Input.vue'
import Avatar from '@/components/ui/avatar/Avatar.vue'
import AvatarImage from '@/components/ui/avatar/AvatarImage.vue'
import AvatarFallback from '@/components/ui/avatar/AvatarFallback.vue'
import { Send, Users } from 'lucide-vue-next'

const socketStore = useSocketStore()
const authStore = useAuthStore()

const selectedUserId = ref<string>('')
const newMessage = ref('')
const messagesContainer = ref<HTMLElement>()
const isLoadingMessages = ref(false)
const isLoadingMore = ref(false)
const shouldScrollToBottom = ref(true)

// Mock users for now - replace with actual user data from your API
const availableUsers = ref([
    { id: '1', name: 'John Doe', avatar: '', username: 'johndoe' },
    { id: '2', name: 'Jane Smith', avatar: '', username: 'janesmith' },
    { id: '3', name: 'Bob Johnson', avatar: '', username: 'bobjohnson' },
    {
        id: '68ca4e57864556b6660bdf06',
        name: 'test',
        avatar: 'https://kwitter-2025.s3.ap-southeast-1.amazonaws.com/images/b2y2r6lpe6d3n2nawkp3nvlea.jpg',
        username: 'test103'
    },
    {
        id: '68b1bcb3379e0be925a1664f',
        name: 'Test34',
        avatar: '',
        username: 'storiusS'
    }
])

const currentMessages = computed(() => {
    if (!selectedUserId.value) return []
    return socketStore.getMessagesWithUser(selectedUserId.value)
})

const selectedUser = computed(() => {
    return availableUsers.value.find((user) => user.id === selectedUserId.value)
})

const isUserOnline = computed(() => {
    return socketStore.onlineUsers.includes(selectedUserId.value)
})

const conversationPagination = computed(() => {
    if (!selectedUserId.value) return null
    return socketStore.getConversationPagination(selectedUserId.value)
})

onMounted(() => {
    if (authStore.isAuthenticated && authStore.user) {
        socketStore.connect(authStore.user._id, authStore.accessToken)
    }
})

onUnmounted(() => {})

// Watch for new messages and auto-scroll if at bottom
watch(
    () => currentMessages.value.length,
    (newLength, oldLength) => {
        if (newLength > oldLength && shouldScrollToBottom.value) {
            nextTick(() => scrollToBottom(true))
        }
    }
)

const selectUser = async (userId: string) => {
    if (selectedUserId.value === userId) return

    selectedUserId.value = userId
    isLoadingMessages.value = true
    shouldScrollToBottom.value = true

    try {
        await socketStore.loadMessages(userId)
        socketStore.markConversationAsRead(userId)

        await nextTick()
        setTimeout(() => scrollToBottom(true), 100)
    } catch (error) {
        console.error('Failed to load messages:', error)
    } finally {
        isLoadingMessages.value = false
    }
}

const sendMessage = async () => {
    if (!newMessage.value.trim() || !selectedUserId.value) return

    socketStore.sendMessage({
        to_user: selectedUserId.value,
        content: newMessage.value.trim()
    })

    newMessage.value = ''
    shouldScrollToBottom.value = true

    await nextTick()
    setTimeout(() => scrollToBottom(true), 100)
}

const scrollToBottom = (force = false) => {
    if (!messagesContainer.value) return
    if (!shouldScrollToBottom.value && !force) return

    setTimeout(() => {
        if (messagesContainer.value) {
            messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
        }
    }, 10)
}

const handleScroll = async () => {
    if (!messagesContainer.value || !selectedUserId.value || isLoadingMore.value) return

    const { scrollTop } = messagesContainer.value
    const pagination = conversationPagination.value

    if (scrollTop <= 10 && pagination?.hasMore) {
        await loadMoreMessages()
    }
}

const loadMoreMessages = async () => {
    if (isLoadingMore.value || !selectedUserId.value) return

    isLoadingMore.value = true
    shouldScrollToBottom.value = false

    try {
        const previousScrollHeight = messagesContainer.value?.scrollHeight || 0
        await socketStore.loadMoreMessages(selectedUserId.value)

        await nextTick()
        if (messagesContainer.value) {
            const newScrollHeight = messagesContainer.value.scrollHeight
            messagesContainer.value.scrollTop = newScrollHeight - previousScrollHeight
        }
    } catch (error) {
        console.error('Failed to load more messages:', error)
    } finally {
        isLoadingMore.value = false
        shouldScrollToBottom.value = true
    }
}

const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const getInitials = (name: string) => {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
}
</script>

<template>
    <div class="flex h-screen bg-background overflow-hidden">
        <!-- Users Sidebar -->
        <div class="w-80 border-r border-border flex flex-col">
            <!-- Header -->
            <div class="p-4 border-b border-border">
                <div class="flex items-center gap-2">
                    <Users class="w-5 h-5" />
                    <h1 class="text-xl font-semibold">Messages</h1>
                </div>
                <div class="text-sm text-muted-foreground mt-1">
                    {{ socketStore.connected ? 'Connected' : 'Connecting...' }}
                </div>
            </div>

            <!-- Users List -->
            <div class="flex-1 overflow-y-auto">
                <div
                    v-for="user in availableUsers"
                    :key="user.id"
                    @click="selectUser(user.id)"
                    :class="[
                        'p-3 hover:bg-muted/50 cursor-pointer border-b border-border/50 transition-colors',
                        selectedUserId === user.id ? 'bg-muted' : ''
                    ]"
                >
                    <div class="flex items-center gap-3">
                        <div class="relative">
                            <Avatar class="h-10 w-10">
                                <AvatarImage :src="user.avatar" :alt="user.name" />
                                <AvatarFallback>{{ getInitials(user.name) }}</AvatarFallback>
                            </Avatar>
                            <!-- Online indicator -->
                            <div
                                v-if="socketStore.onlineUsers.includes(user.id)"
                                class="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-background rounded-full"
                            />
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="flex justify-between items-center">
                                <h3 class="font-medium text-sm truncate">{{ user.name }}</h3>
                                <div
                                    v-if="socketStore.getUnreadMessagesCount(user.id) > 0"
                                    class="text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full min-w-[18px] text-center"
                                >
                                    {{ socketStore.getUnreadMessagesCount(user.id) }}
                                </div>
                            </div>
                            <p class="text-xs text-muted-foreground">@{{ user.username }}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Chat Area -->
        <div class="flex-1 flex flex-col min-h-0">
            <div v-if="!selectedUserId" class="flex-1 flex items-center justify-center">
                <div class="text-center text-muted-foreground">
                    <Users class="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <h2 class="text-lg font-medium mb-2">Select a conversation</h2>
                    <p class="text-sm">Choose a user from the sidebar to start messaging</p>
                </div>
            </div>

            <div v-else class="flex-1 flex flex-col min-h-0">
                <!-- Chat Header -->
                <div class="p-4 border-b border-border flex-shrink-0">
                    <div class="flex items-center gap-3">
                        <Avatar class="h-10 w-10">
                            <AvatarImage :src="selectedUser?.avatar || ''" :alt="selectedUser?.name" />
                            <AvatarFallback>{{ getInitials(selectedUser?.name || '') }}</AvatarFallback>
                        </Avatar>
                        <div>
                            <h2 class="font-semibold text-lg">{{ selectedUser?.name }}</h2>
                            <p class="text-sm text-muted-foreground">
                                {{ isUserOnline ? 'Online' : 'Offline' }}
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Messages -->
                <div
                    ref="messagesContainer"
                    class="flex-1 overflow-y-auto p-4 space-y-4 min-h-0"
                    @scroll="handleScroll"
                >
                    <!-- Load more indicator at top -->
                    <div v-if="isLoadingMore" class="flex justify-center py-2">
                        <div
                            class="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full"
                        ></div>
                        <span class="ml-2 text-xs text-muted-foreground">Loading more messages...</span>
                    </div>

                    <!-- Load more button (if needed) -->
                    <div
                        v-else-if="conversationPagination?.hasMore && !isLoadingMessages"
                        class="flex justify-center py-2"
                    >
                        <button
                            @click="loadMoreMessages"
                            class="text-xs text-primary hover:text-primary/80 transition-colors px-3 py-1 rounded"
                        >
                            Load older messages
                        </button>
                    </div>

                    <!-- Loading spinner -->
                    <div v-if="isLoadingMessages" class="flex justify-center items-center py-8">
                        <div
                            class="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full"
                        ></div>
                        <span class="ml-2 text-sm text-muted-foreground">Loading messages...</span>
                    </div>

                    <!-- Messages -->
                    <template v-else>
                        <div
                            v-for="message in currentMessages"
                            :key="message.id"
                            :class="[
                                'flex',
                                message.from_user === authStore.user?._id ? 'justify-end' : 'justify-start'
                            ]"
                        >
                            <div
                                :class="[
                                    'max-w-xs lg:max-w-md px-4 py-2 rounded-lg',
                                    message.from_user === authStore.user?._id
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted text-foreground'
                                ]"
                            >
                                <p class="text-sm">{{ message.content }}</p>
                                <p
                                    :class="[
                                        'text-xs mt-1 opacity-70',
                                        message.from_user === authStore.user?._id ? 'text-right' : 'text-left'
                                    ]"
                                >
                                    {{ formatTime(message.created_at) }}
                                    <span
                                        v-if="message.from_user === authStore.user?._id && message.read_at"
                                        class="ml-1"
                                        >✓</span
                                    >
                                </p>
                            </div>
                        </div>
                    </template>
                </div>

                <!-- Message Input -->
                <div class="p-4 border-t border-border flex-shrink-0">
                    <form @submit.prevent="sendMessage" class="flex gap-2">
                        <Input
                            v-model="newMessage"
                            placeholder="Type a message..."
                            class="flex-1"
                            @keydown.enter.prevent="sendMessage"
                        />
                        <Button type="submit" size="icon" :disabled="!newMessage.trim() || !socketStore.connected">
                            <Send class="w-4 h-4" />
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    </div>
</template>
