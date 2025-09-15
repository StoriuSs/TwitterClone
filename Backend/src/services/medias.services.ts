import { Request } from 'express'
import { getFilesFromDir, handleUploadImage, handleUploadVideo, handleUploadVideoHLS } from '~/utils/file'
import sharp from 'sharp'
import path from 'path'
import { UPLOAD_IMAGE_DIR, UPLOAD_VIDEO_DIR } from '~/constants/dir'
import { HOST, NODE_ENV, PORT } from '~/configs/env.config'
import fs from 'fs'
import { EncodingStatus, MediaType } from '~/constants/enum'
import { Media } from '~/models/schemas/Media.schema'
import { encodeHLSWithMultipleVideoStreams } from '~/utils/video'
import databaseService from './database.services'
import VideoStatus from '~/models/schemas/VideoStatus.schema'
import { uploadFileToS3 } from '~/utils/s3'
import mime from 'mime'
import fsPromise from 'fs/promises'
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
                const files = getFilesFromDir(path.resolve(UPLOAD_VIDEO_DIR, idName))
                await Promise.all(
                    files.map((filepath) => {
                        const relativePath = filepath.replace(path.resolve(UPLOAD_VIDEO_DIR), '')
                        const filename = `video-hls${relativePath}`.replace(/\\/g, '/')
                        return uploadFileToS3({
                            filename: filename,
                            filepath: filepath,
                            contentType: mime.getType(filepath) || 'application/vnd.apple.mpegurl'
                        })
                    })
                )

                // Clean up the HLS files and folder recursively
                await fsPromise.rm(path.resolve(UPLOAD_VIDEO_DIR, idName), { recursive: true, force: true })

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
                // Upload to S3
                const S3Result = await uploadFileToS3({
                    filename: 'images/' + newName,
                    filepath: newPath,
                    contentType: mime.getType(newPath) || 'image/jpeg'
                })

                // Clean up temp files
                Promise.all([fsPromise.unlink(file.filepath), fsPromise.unlink(newPath)])
                return {
                    url: S3Result.Location as string,
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
                const S3Result = await uploadFileToS3({
                    filename: 'videos/' + file.newFilename,
                    filepath: file.filepath,
                    contentType: mime.getType(file.filepath) || 'video/mp4'
                })
                fsPromise.unlink(file.filepath)
                return {
                    url: S3Result.Location as string,
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
                            : `http://localhost:${PORT}/static/video-hls/${file.newFilename}/master.m3u8`,
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
