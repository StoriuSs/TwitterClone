import { toast } from 'vue-sonner'

// Global toast deduplication
const recentToasts = new Set<string>()
const TOAST_DEDUP_TIMEOUT = 2000 // 2 seconds

function addToastDedup(message: string) {
    if (recentToasts.has(message)) {
        return false // Duplicate toast
    }
    recentToasts.add(message)
    setTimeout(() => {
        recentToasts.delete(message)
    }, TOAST_DEDUP_TIMEOUT)
    return true // Allow toast
}

export const showSuccessToast = (message: string) => {
    if (addToastDedup(message)) {
        toast.success(message)
    }
}

export const showErrorToast = (message: string) => {
    if (addToastDedup(message)) {
        toast.error(message)
    }
}

export const showInfoToast = (message: string) => {
    toast.info(message)
}

export const showWarningToast = (message: string) => {
    toast.warning(message)
}

export const extractSuccessMessage = (response: { message?: string } | string, fallback: string) => {
    const message = typeof response === 'string' ? response : response?.message || fallback
    return message
}

export const extractErrorMessage = (error: unknown, fallback = 'An error occurred') => {
    let message = fallback

    if (typeof error === 'string') {
        message = error
    } else if (
        error &&
        typeof error === 'object' &&
        'response' in error &&
        error.response &&
        typeof error.response === 'object' &&
        'data' in error.response &&
        error.response.data &&
        typeof error.response.data === 'object' &&
        'message' in error.response.data
    ) {
        message = error.response.data.message as string
    } else if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
        message = error.message
    }

    return message
}
