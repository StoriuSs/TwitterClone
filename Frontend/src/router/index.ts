import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '@/components/layout/MainLayout.vue'
import Home from '@/components/pages/Home.vue'
import ProfilePage from '@/components/pages/ProfilePage.vue'
import LoginOauth from '@/components/auth/LoginOauth.vue'
import SignUp from '@/components/auth/SignUp.vue'
import SignUpEmail from '@/components/auth/SignUpEmail.vue'
import LoginForm from '@/components/auth/LoginForm.vue'
import EmailVerification from '@/components/auth/EmailVerification.vue'
import VerifyEmailToken from '../components/auth/VerifyEmailToken.vue'
import ForgotPassword from '@/components/auth/ForgotPassword.vue'
import ResetPassword from '@/components/auth/ResetPassword.vue'
import { useAuthStore } from '@/stores/auth'
const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        // Auth routes (no layout)
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
        },
        {
            path: '/email-verify',
            name: 'email-verify-token',
            component: VerifyEmailToken
        },
        {
            path: '/forgot-password',
            name: 'forgot-password',
            component: ForgotPassword
        },
        {
            path: '/reset-password',
            name: 'reset-password',
            component: ResetPassword
        },
        // App routes (with layout)
        {
            path: '/',
            component: MainLayout,
            children: [
                {
                    path: '',
                    name: 'home',
                    component: Home
                },
                {
                    path: '/profile/:username',
                    name: 'profile',
                    component: ProfilePage
                }
            ]
        }
    ]
})

// List of routes that should be inaccessible to logged-in users
const authRoutes = ['/login', '/signup', '/signup/email', '/login/oauth', '/email-verify']

router.beforeEach(async (to, from, next) => {
    const accessToken = localStorage.getItem('access_token')
    let user = JSON.parse(localStorage.getItem('user') || 'null')

    // If user has access token but no user data, try to fetch it
    if (accessToken && !user) {
        try {
            // We need to import the auth store here to get user data
            const authStore = useAuthStore()
            await authStore.getUserInfo()
            user = authStore.user
        } catch (error) {
            console.error('Failed to get user info:', error)
            // If we can't get user info, remove invalid token and redirect to signup
            localStorage.removeItem('access_token')
            localStorage.removeItem('user')
            next({ path: '/signup' })
            return
        }
    }

    // If user is authenticated and tries to access auth routes, check verification status
    if (accessToken && authRoutes.includes(to.path)) {
        // Allow unverified users to access login (they might want to login as different user)
        if (to.path === '/login' && user && user.verify !== 1) {
            next()
            return
        }
        // For verified users accessing auth routes, redirect to home
        if (user && user.verify === 1) {
            next({ path: '/' })
            return
        }
        // For unverified users accessing other auth routes, allow it
        next()
        return
    }

    // Allow access to verify-email for authenticated but unverified users
    if (accessToken && to.path === '/verify-email') {
        // If user is already verified, redirect to home
        if (user && user.verify === 1) {
            next({ path: '/' })
            return
        }
        // Otherwise, allow access to verification page
        next()
        return
    }

    // If user is NOT authenticated and tries to access protected routes, redirect to signup
    if (!accessToken && (to.path === '/' || to.path.startsWith('/profile/'))) {
        next({ path: '/signup' })
        return
    }

    // If user is authenticated but not verified, and trying to access protected routes, redirect to verify-email
    if (accessToken && user && user.verify !== 1 && (to.path === '/' || to.path.startsWith('/profile/'))) {
        next({ path: '/verify-email', query: { email: user.email } })
        return
    }

    next()
})

export default router
