import { createRouter, createWebHistory } from 'vue-router'
import Homepage from '@/components/auth/Homepage.vue'
import LoginOauth from '@/components/auth/LoginOauth.vue'
import SignUp from '@/components/auth/SignUp.vue'
import SignUpEmail from '@/components/auth/SignUpEmail.vue'
import LoginForm from '@/components/auth/LoginForm.vue'
import EmailVerification from '@/components/auth/verification/EmailVerification.vue'

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
        },
        {
            path: '/verify-email',
            name: 'verify-email',
            component: EmailVerification
        }
    ]
})

// List of routes that should be inaccessible to logged-in users
const authRoutes = ['/login', '/signup', '/signup/email', '/login/oauth', '/verify-email']

router.beforeEach((to, from, next) => {
    const accessToken = localStorage.getItem('access_token')
    // If user is authenticated and tries to access an auth route, redirect to home
    if (accessToken && authRoutes.includes(to.path)) {
        next({ path: '/' })
        return
    }
    // If user is NOT authenticated and tries to access the homepage, redirect to signup
    if (!accessToken && to.path === '/') {
        next({ path: '/signup' })
        return
    }
    next()
})

export default router
