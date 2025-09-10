import { defineStore } from 'pinia'
import api from '@/lib/api'
import type { ProfileState } from '@/interfaces/profile.interface'
import { extractErrorMessage } from '@/interfaces/error.interface'

export const useProfileStore = defineStore('profile', {
    state: (): ProfileState => ({
        profile: null,
        userTweets: [],
        loading: false,
        error: null,
        isFollowing: false,
        followersCount: 0,
        followingCount: 0,
        tweetsCount: 0
    }),

    actions: {
        async fetchProfile(username: string) {
            this.loading = true
            this.error = null

            try {
                const response = await api.get(`/users/${username}`)
                this.profile = response.data.result

                // TODO: Fetch additional stats like followers, following, tweets count
                // These would require separate API endpoints that aren't implemented yet

                return {
                    success: true,
                    data: response.data.result
                }
            } catch (error) {
                console.error('Error fetching profile:', error)
                this.error = extractErrorMessage(error)
                this.profile = null

                return {
                    success: false,
                    error: this.error
                }
            } finally {
                this.loading = false
            }
        },

        async fetchUserTweets(_username?: string) {
            // TODO: Backend doesn't have user-specific tweets endpoint yet
            // For now, return empty array - this will be implemented later
            this.userTweets = []

            return {
                success: true,
                data: []
            }
        },

        async followUser(userId: string) {
            try {
                const response = await api.post('/users/follow', {
                    followed_user_id: userId
                })

                this.isFollowing = true
                this.followersCount += 1

                return {
                    success: true,
                    data: response.data.result
                }
            } catch (error) {
                console.error('Error following user:', error)
                this.error = extractErrorMessage(error)

                return {
                    success: false,
                    error: this.error
                }
            }
        },

        async unfollowUser(userId: string) {
            try {
                const response = await api.delete(`/users/follow/${userId}`)

                this.isFollowing = false
                this.followersCount = Math.max(0, this.followersCount - 1)

                return {
                    success: true,
                    data: response.data.result
                }
            } catch (error) {
                console.error('Error unfollowing user:', error)
                this.error = extractErrorMessage(error)

                return {
                    success: false,
                    error: this.error
                }
            }
        },

        clearProfile() {
            this.profile = null
            this.userTweets = []
            this.error = null
            this.isFollowing = false
            this.followersCount = 0
            this.followingCount = 0
            this.tweetsCount = 0
        },

        clearError() {
            this.error = null
        }
    }
})
