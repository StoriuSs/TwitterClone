import type { Socket } from 'socket.io-client'

export interface ConversationPagination {
    currentPage: number
    totalPages: number
    hasMore: boolean
}

export interface SocketStateType {
    socket: Socket | null
    connected: boolean
    onlineUsers: string[]
    messages: PrivateMessage[]
    unreadCount: number
    conversationPagination: Map<string, ConversationPagination>
}

export interface PrivateMessage {
    id: string
    from_user: string
    to_user: string
    content: string
    created_at: string
    read_at?: string
}

export interface SendMessagePayload {
    to_user: string
    content: string
}
