<script setup lang="ts">
import { onMounted, ref } from 'vue'
import Hls from 'hls.js'

// Define the video element ref
const videoElement = ref<HTMLVideoElement | null>(null)

// Video source
const src = 'http://localhost:8888/static/video-hls/N3U3zwA-qUrjcN7MfwqQc/master.m3u8'

onMounted(() => {
    if (!videoElement.value) return

    // Use native HLS if supported (Safari, iOS)
    if (videoElement.value.canPlayType('application/vnd.apple.mpegurl')) {
        videoElement.value.src = src
        console.log('Using native HLS support')
        return
    }

    // Use HLS.js for other browsers (Chrome, Firefox)
    if (Hls.isSupported()) {
        const hls = new Hls()
        hls.loadSource(src)
        hls.attachMedia(videoElement.value)

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
            console.log('HLS manifest parsed')
            // Optional: Auto-play when ready
            // videoElement.value?.play()
        })
    } else {
        console.error('HLS is not supported in this browser')
    }
})
</script>

<template>
    <div class="w-full max-w-2xl mx-auto rounded-lg overflow-hidden shadow-lg">
        <video
            ref="videoElement"
            controls
            crossorigin="anonymous"
            playsinline
            class="w-full aspect-video bg-black"
            poster="https://image.mux.com/VZtzUzGRv02OhRnZCxcNg49OilvolTqdnFLEqBsTwaxU/thumbnail.webp?time=268&width=1280"
        ></video>
    </div>
</template>
