<script setup lang="ts">
import { useThemeStore } from '@/stores/theme'
import { onMounted, computed } from 'vue'

const themeStore = useThemeStore()

// Compute current theme for toast
const currentTheme = computed(() => {
    if (themeStore.theme === 'system') {
        return themeStore.systemTheme === 'dark' ? 'dark' : 'light'
    }
    return themeStore.theme
})

onMounted(() => {
    themeStore.init()
})
</script>

<template>
    <div
        class="min-h-screen overflow-x-hidden bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100 scrollbar-hide"
    >
        <router-view />

        <!-- Toast Notifications - Available on all pages -->
        <Toaster :theme="currentTheme" position="top-center" :duration="2000" :close-button="true" rich-colors />
    </div>
</template>
