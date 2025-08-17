import { createRouter, createWebHistory } from 'vue-router'
import Homepage from '@/components/auth/Homepage.vue'
import LoginOauth from '@/components/auth/LoginOauth.vue'
import SignUp from '@/components/auth/SignUp.vue'
import SignUpEmail from '@/components/auth/SignUpEmail.vue'
import LoginForm from '@/components/auth/LoginForm.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'home',
            component: Homepage
        },
        {
            path: '/login/oauth',
            name: 'login-oauth',
            component: LoginOauth
        },
        {
            path: '/signup',
            name: 'signup',
            component: SignUp
        },
        {
            path: '/signup/email',
            name: 'signup-email',
            component: SignUpEmail
        },
        {
            path: '/login',
            name: 'login',
            component: LoginForm
        }
    ]
})

export default router
