<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
const route = useRoute()
const router = useRouter()

const query = route.query
const accessToken = query.access_token?.toString() || ''
localStorage.setItem('access_token', accessToken)
console.log(query.access_token)
console.log(query.newUser)

router.push('/')
</script>

<template>
    <div>This is the login page!</div>
</template>
