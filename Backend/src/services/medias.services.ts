import { Request } from 'express'
import { handleUploadImage, handleUploadVideo, handleUploadVideoHLS } from '~/utils/file'
import sharp from 'sharp'
import path from 'path'
import { UPLOAD_IMAGE_DIR } from '~/constants/dir'
import { HOST, NODE_ENV, PORT } from '~/configs/env.config'
import fs from 'fs'
import { EncodingStatus, MediaType } from '~/constants/enum'
import { Media } from '~/models/schemas/Media.schema'
import { encodeHLSWithMultipleVideoStreams } from '~/utils/video'
import databaseService from './database.services'
import VideoStatus from '~/models/schemas/VideoStatus.schema'

class Queue {
    items: string[]
    encoding: boolean
    constructor() {
        this.items = []
        this.encoding = false
    }
    async enqueue(item: string) {
        this.items.push(item)
        // initialize the video status
        const idName = path.basename(item, path.extname(item))
        await databaseService.videoStatuses.insertOne(
            new VideoStatus({
                name: idName,
                status: EncodingStatus.Pending,
                message: 'Video is waiting to be processed'
            })
        )
        this.processEncode()
    }
    dequeue(): string | undefined {
        return this.items.shift()
    }
    async processEncode() {
        if (this.encoding) return
        if (this.items.length > 0) {
            this.encoding = true
            // update the video status
            const idName = path.basename(this.items[0], path.extname(this.items[0]))
            await databaseService.videoStatuses
                .updateOne(
                    { name: idName },
                    {
                        $set: { status: EncodingStatus.Processing, message: 'Video is being processed' },
                        $currentDate: { updated_at: true }
                    }
                )
                .catch((error) => {
                    console.error('Error updating video status:', error)
                })

            const videoPath = this.items[0]
            try {
                await encodeHLSWithMultipleVideoStreams(videoPath)
                this.dequeue()
                await fs.promises.unlink(videoPath)
                await databaseService.videoStatuses.updateOne(
                    { name: idName },
                    {
                        $set: { status: EncodingStatus.Completed, message: 'Video processing completed' },
                        $currentDate: { updated_at: true }
                    }
                )
                console.log('Successfully processed video:', videoPath)
            } catch (error) {
                console.error('Error encoding video to HLS:', error)
                await databaseService.videoStatuses.updateOne(
                    { name: idName },
                    {
                        $set: { status: EncodingStatus.Failed, message: 'Video processing failed' },
                        $currentDate: { updated_at: true }
                    }
                )
            }
            this.encoding = false
            this.processEncode()
        } else {
            console.log('Encode video queue is empty')
        }
    }
}

const queue = new Queue()

class MediasServices {
    async uploadImageService(req: Request) {
        // create the temp uploaded images
        const files = await handleUploadImage(req)
        const result: Media[] = await Promise.all(
            files.map(async (file) => {
                // Create permanent filename and path
                const newName = file.newFilename.replace(/\.[^/.]+$/, '.jpg')
                const newPath = path.join(UPLOAD_IMAGE_DIR, newName)
                // Process with Sharp and save directly to uploads folder
                await sharp(file.filepath).jpeg().toFile(newPath)
                // Clean up temp file
                fs.unlinkSync(file.filepath)
                return {
                    url:
                        NODE_ENV === 'production'
                            ? `${HOST}/static/image/${newName}`
                            : `http://localhost:${PORT}/static/image/${newName}`,
                    type: MediaType.Image
                }
            })
        )
        return result
    }

    async uploadVideoService(req: Request) {
        const files = await handleUploadVideo(req)
        const result: Media[] = await Promise.all(
            files.map(async (file) => {
                return {
                    url:
                        NODE_ENV === 'production'
                            ? `${HOST}/static/video/${file.newFilename}`
                            : `http://localhost:${PORT}/static/video/${file.newFilename}`,
                    type: MediaType.Video
                }
            })
        )
        return result
    }

    async uploadVideoHLSService(req: Request) {
        const files = await handleUploadVideoHLS(req)
        const result: Media[] = await Promise.all(
            files.map(async (file) => {
                queue.enqueue(file.filepath)
                return {
                    url:
                        NODE_ENV === 'production'
                            ? `${HOST}/static/video-hls/${file.newFilename}.m3u8`
                            : `http://localhost:${PORT}/static/video-hls/${file.newFilename}.m3u8`,
                    type: MediaType.HLS
                }
            })
        )
        return result
    }

    async getVideoStatusService(id: string) {
        const videoStatus = await databaseService.videoStatuses.findOne({ name: id })
        return videoStatus
    }
}
const mediasServices = new MediasServices()
export default mediasServices
