import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useThemeStore = defineStore('theme', () => {
    // State
    const theme = ref(localStorage.getItem('theme') || 'system')
    const systemTheme = ref(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')

    // Actions
    const setTheme = (newTheme: 'light' | 'dark' | 'system') => {
        theme.value = newTheme
        localStorage.setItem('theme', newTheme)
        applyTheme()
    }

    // Update theme based on system preference changes
    const setupSystemThemeWatcher = () => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
        const handleChange = (e: MediaQueryListEvent) => {
            systemTheme.value = e.matches ? 'dark' : 'light'
            if (theme.value === 'system') {
                applyTheme()
            }
        }

        mediaQuery.addEventListener('change', handleChange)
        return () => mediaQuery.removeEventListener('change', handleChange)
    }

    // Apply theme to document
    const applyTheme = () => {
        const resolvedTheme = theme.value === 'system' ? systemTheme.value : theme.value
        if (resolvedTheme === 'dark') {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
    }

    // Initialize theme on store creation
    const init = () => {
        applyTheme()
        setupSystemThemeWatcher()
    }

    // Watch for theme changes to apply them
    watch([theme, systemTheme], () => {
        applyTheme()
    })

    return {
        theme,
        systemTheme,
        setTheme,
        init
    }
})
