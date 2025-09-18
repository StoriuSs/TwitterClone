import { defineStore } from 'pinia'
import { io } from 'socket.io-client'
import api from '@/lib/api'
import type { SocketStateType, PrivateMessage, SendMessagePayload } from '@/interfaces/socket.interface'

export const useSocketStore = defineStore('socket', {
    state: (): SocketStateType => ({
        socket: null,
        connected: false,
        onlineUsers: [],
        messages: [],
        unreadCount: 0,
        conversationPagination: new Map()
    }),

    getters: {
        isConnected: (state) => state.connected,
        getMessagesWithUser: (state) => (userId: string) => {
            return state.messages
                .filter((msg) => msg.from_user === userId || msg.to_user === userId)
                .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        },
        getUnreadMessagesCount: (state) => (userId?: string) => {
            if (userId) {
                return state.messages.filter((msg) => msg.from_user === userId && !msg.read_at).length
            }
            return state.unreadCount
        }
    },

    actions: {
        connect(userId: string, accessToken: string) {
            if (this.socket?.connected) return

            this.socket = io(import.meta.env.VITE_API_URL, {
                auth: {
                    token: accessToken,
                    userId: userId
                },
                transports: ['websocket', 'polling']
            })

            this.setupSocketListeners()
        },

        setupSocketListeners() {
            if (!this.socket) return

            this.socket.on('connect', () => {
                this.connected = true
            })

            this.socket.on('disconnect', () => {
                this.connected = false
            })

            this.socket.on('online_users', (users: string[]) => {
                this.onlineUsers = users
            })

            this.socket.on('new_message', (message: PrivateMessage) => {
                this.messages.push(message)
                if (!message.read_at) {
                    this.unreadCount++
                }
            })

            this.socket.on('message_read', (messageId: string) => {
                const message = this.messages.find((msg) => msg.id === messageId)
                if (message) {
                    message.read_at = new Date().toISOString()
                    this.unreadCount = Math.max(0, this.unreadCount - 1)
                }
            })
        },

        sendMessage(payload: SendMessagePayload) {
            if (!this.socket?.connected) return
            this.socket.emit('send_message', payload)
        },

        markMessageAsRead(messageId: string) {
            if (!this.socket?.connected) return

            this.socket.emit('mark_as_read', { messageId })
        },

        markConversationAsRead(userId: string) {
            const unreadMessages = this.messages.filter((msg) => msg.from_user === userId && !msg.read_at)

            unreadMessages.forEach((msg) => {
                this.markMessageAsRead(msg.id)
            })
        },

        disconnect() {
            if (this.socket) {
                this.socket.disconnect()
                this.socket = null
                this.connected = false
                this.onlineUsers = []
                this.messages = []
                this.unreadCount = 0
            }
        },

        // Load messages for a specific user from API
        async loadMessages(recipientId: string, page = 1, limit = 15) {
            try {
                const response = await api.get(`/messages/recipients/${recipientId}`, {
                    params: { page, limit }
                })

                const { data: messages, totalPages } = response.data

                if (page === 1) {
                    this.messages = this.messages.filter(
                        (msg) => msg.from_user !== recipientId && msg.to_user !== recipientId
                    )
                    this.messages.push(...messages)
                } else {
                    const otherConversations = this.messages.filter(
                        (msg) => msg.from_user !== recipientId && msg.to_user !== recipientId
                    )
                    const currentConversation = this.messages.filter(
                        (msg) => msg.from_user === recipientId || msg.to_user === recipientId
                    )

                    this.messages = [...otherConversations, ...currentConversation, ...messages]
                }

                this.messages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

                this.conversationPagination.set(recipientId, {
                    currentPage: page,
                    totalPages,
                    hasMore: page < totalPages
                })

                return { messages, totalPages, hasMore: page < totalPages }
            } catch (error) {
                console.error('Error loading messages:', error)
                throw error
            }
        },

        // Load more messages (for pagination)
        async loadMoreMessages(recipientId: string) {
            const paginationInfo = this.conversationPagination.get(recipientId)

            if (!paginationInfo || !paginationInfo.hasMore) {
                return { messages: [], hasMore: false }
            }

            return this.loadMessages(recipientId, paginationInfo.currentPage + 1)
        },

        getConversationPagination(recipientId: string) {
            return (
                this.conversationPagination.get(recipientId) || {
                    currentPage: 0,
                    totalPages: 0,
                    hasMore: false
                }
            )
        }
    }
})
