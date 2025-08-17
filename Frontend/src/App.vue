<script setup lang="ts">
import { useThemeStore } from '@/stores/theme'
import { onMounted } from 'vue'

const themeStore = useThemeStore()

onMounted(() => {
    themeStore.init()
})
</script>

<template>
    <div
        class="min-h-screen overflow-x-hidden bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100 scrollbar-hide"
    >
        <router-view />
    </div>
</template>
