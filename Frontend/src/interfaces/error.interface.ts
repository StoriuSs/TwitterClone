// Define the structure of validation error fields from the backend
export interface ValidationErrorField {
    type?: string
    value?: string
    msg?: string | { message?: string; status?: number }
    path?: string
    location?: string
}

// Define the structure of error response from the backend
export interface ApiErrorResponse {
    message?: string
    errors?: Record<string, ValidationErrorField>
    error?: string
    status?: number
}

// Define the structure of Axios error with response data
export interface AxiosErrorWithResponse {
    response?: {
        data?: ApiErrorResponse
        status?: number
    }
    message?: string
}

/**
 * Extract the most relevant error message from an API error response
 * @param error - The error object received from the API
 * @returns A user-friendly error message string
 */
export function extractErrorMessage(error: unknown): string {
    // Handle Axios error response
    if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as AxiosErrorWithResponse
        const errorData = axiosError.response?.data

        if (errorData?.errors) {
            // Get all validation error fields
            const errorFields = Object.keys(errorData.errors)

            if (errorFields.length > 0) {
                // Get the first error field
                const firstErrorField = errorFields[0]
                const firstError = errorData.errors[firstErrorField]

                // Extract the error message
                if (typeof firstError.msg === 'string') {
                    return firstError.msg
                } else if (typeof firstError.msg === 'object' && firstError.msg?.message) {
                    return firstError.msg.message
                } else {
                    return `Invalid ${firstErrorField}`
                }
            } else {
                return errorData.message || 'Validation failed'
            }
        } else {
            return (
                errorData?.message ||
                errorData?.error ||
                `Request failed with status code ${axiosError.response?.status}` ||
                'Request failed'
            )
        }
    } else if (error instanceof Error) {
        return error.message
    } else {
        return 'An unexpected error occurred'
    }
}
