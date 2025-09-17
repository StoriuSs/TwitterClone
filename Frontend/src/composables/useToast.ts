import { toast } from 'vue-sonner'

export interface ToastOptions {
    description?: string
    duration?: number
    action?: {
        label: string
        onClick: () => void
    }
}

export function useToast() {
    return {
        success: (message: string, options?: ToastOptions) => {
            return toast.success(message, {
                description: options?.description,
                duration: options?.duration,
                action: options?.action
            })
        },

        error: (message: string, options?: ToastOptions) => {
            return toast.error(message, {
                description: options?.description,
                duration: options?.duration,
                action: options?.action
            })
        },

        info: (message: string, options?: ToastOptions) => {
            return toast.info(message, {
                description: options?.description,
                duration: options?.duration,
                action: options?.action
            })
        },

        warning: (message: string, options?: ToastOptions) => {
            return toast.warning(message, {
                description: options?.description,
                duration: options?.duration,
                action: options?.action
            })
        },

        loading: (message: string) => {
            return toast.loading(message)
        },

        promise: <T>(
            promise: Promise<T>,
            msgs: {
                loading: string
                success: string | ((data: T) => string)
                error: string | ((error: unknown) => string)
            }
        ) => {
            return toast.promise(promise, msgs)
        },

        dismiss: (toastId?: string | number) => {
            return toast.dismiss(toastId)
        },

        // Helper to extract success message from backend response
        successFromResponse: (response: { message?: string } | string, fallback = 'Success!') => {
            const message = typeof response === 'string' ? response : response?.message || fallback
            return toast.success(message)
        },

        // Helper to extract error message from backend error
        errorFromResponse: (error: unknown, fallback = 'An error occurred') => {
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

            return toast.error(message)
        }
    }
}
