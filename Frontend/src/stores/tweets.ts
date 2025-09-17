import { defineStore } from 'pinia'
import api from '@/lib/api'
import type { NewTweetData, TweetsState } from '@/interfaces/tweet.interface'
import { extractErrorMessage } from '@/interfaces/error.interface'

export const useTweetsStore = defineStore('tweets', {
    state: (): TweetsState => ({
        tweets: [],
        trendingTopics: [],
        whoToFollow: [],
        loading: false,
        error: null,
        currentPage: 1,
        totalPages: 1
    }),

    actions: {
        async fetchNewsFeed(page: number = 1, limit: number = 10, source: string = 'for-you') {
            this.loading = true
            this.error = null

            try {
                const response = await api.get('/tweets', {
                    params: { page, limit, source }
                })

                if (page === 1) {
                    this.tweets = response.data.result.tweets
                } else {
                    this.tweets = [...this.tweets, ...response.data.result.tweets]
                }

                this.currentPage = response.data.result.page
                this.totalPages = response.data.result.total_pages

                return {
                    success: true,
                    data: response.data.result
                }
            } catch (error) {
                console.error('Error fetching news feed:', error)
                this.error = extractErrorMessage(error)

                return {
                    success: false,
                    error: this.error
                }
            } finally {
                this.loading = false
            }
        },

        async createTweet(tweetData: NewTweetData) {
            this.loading = true
            this.error = null

            try {
                const response = await api.post('/tweets', tweetData)

                return {
                    success: true,
                    message: response.data.message || 'Tweet created successfully'
                }
            } catch (error) {
                console.error('Error creating tweet:', error)
                this.error = extractErrorMessage(error)

                return {
                    success: false,
                    error: this.error
                }
            } finally {
                this.loading = false
            }
        },

        async fetchTrendingTopics() {
            this.loading = true

            try {
                // This would be replaced with an actual API call when available
                // const response = await api.get('/trends')
                // this.trendingTopics = response.data.result

                // Temporary mock data
                this.trendingTopics = [
                    {
                        id: 1,
                        category: 'Technology · Trending',
                        title: '#VueJS',
                        tweets: '24.5K tweets'
                    },
                    {
                        id: 2,
                        category: 'Business · Trending',
                        title: '#WebDevelopment',
                        tweets: '18.2K tweets'
                    },
                    {
                        id: 3,
                        category: 'Entertainment · Trending',
                        title: 'Kwitter Launch',
                        tweets: '12.9K tweets'
                    }
                ]
            } catch (error) {
                console.error('Error fetching trending topics:', error)
            } finally {
                this.loading = false
            }
        },

        async fetchWhoToFollow() {
            this.loading = true

            try {
                // This would be replaced with an actual API call when available
                // const response = await api.get('/users/suggestions')
                // this.whoToFollow = response.data.result

                // Temporary mock data
                this.whoToFollow = [
                    {
                        id: 1,
                        name: 'Vue.js',
                        username: 'vuejs',
                        avatar: 'https://placehold.co/400?text=Vue'
                    },
                    {
                        id: 2,
                        name: 'Tailwind CSS',
                        username: 'tailwindcss',
                        avatar: 'https://placehold.co/400?text=TW'
                    }
                ]
            } catch (error) {
                console.error('Error fetching who to follow:', error)
            } finally {
                this.loading = false
            }
        },

        clearError() {
            this.error = null
        }
    }
})
