import { Request, Response, NextFunction } from 'express'
import path from 'path'
import { UPLOAD_IMAGE_DIR, UPLOAD_VIDEO_DIR } from '~/constants/dir'
import httpStatus from '~/constants/httpStatus'
import { userMessages } from '~/constants/messages'
import mediasServices from '~/services/medias.services'
import fs from 'fs'
import mime from 'mime'
import { serveFileFromS3 } from '~/utils/s3'

export const uploadImageController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const imgUrl = await mediasServices.uploadImageService(req)
        return res.json({
            message: userMessages.uploadSuccess,
            result: imgUrl
        })
    } catch (error) {
        next(error)
    }
}

export const serveImageController = (req: Request, res: Response, next: NextFunction) => {
    try {
        const filename = req.params.filename
        return res.sendFile(path.resolve(UPLOAD_IMAGE_DIR, filename), (err) => {
            if (err) {
                next(err)
            }
        })
    } catch (error) {
        next(error)
    }
}

export const uploadVideoController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const videoUrl = await mediasServices.uploadVideoService(req)
        return res.json({
            message: userMessages.uploadSuccess,
            result: videoUrl
        })
    } catch (error) {
        next(error)
    }
}

export const serveVideoController = (req: Request, res: Response) => {
    const range = req.headers.range
    if (!range) {
        return res.status(httpStatus.BAD_REQUEST).send('Range header is required')
    }
    const { filename } = req.params
    const videoPath = path.resolve(UPLOAD_VIDEO_DIR, filename)
    // video size (bytes)
    const videoSize = fs.statSync(videoPath).size
    // chunk size for each stream part
    const chunkSize = 10 ** 6 // 1 MB
    const start = Number(range.replace(/\D/g, ''))
    const end = Math.min(start + chunkSize, videoSize - 1)
    // normally this equals to the chunk size, except when it's near the end of the video
    const contentLength = end - start + 1
    const contentType = mime.getType(videoPath) || 'video/*'
    const headers = {
        'Content-Type': contentType,
        'Content-Length': contentLength,
        'Accept-Ranges': 'bytes',
        'Content-Range': `bytes ${start}-${end}/${videoSize}`
    }
    res.writeHead(httpStatus.PARTIAL_CONTENT, headers)
    const videoStreams = fs.createReadStream(videoPath, { start, end })
    videoStreams.pipe(res)
}

export const uploadVideoHLSController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const hlsUrl = await mediasServices.uploadVideoHLSService(req)
        return res.json({
            message: userMessages.uploadSuccess,
            result: hlsUrl
        })
    } catch (error) {
        next(error)
    }
}

export const serveM3U8Controller = (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params
        serveFileFromS3(res, `video-hls/${id}/master.m3u8`)
    } catch (error) {
        next(error)
    }
}

export const serveSegmentController = (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id, v, segment } = req.params
        serveFileFromS3(res, `video-hls/${id}/${v}/${segment}`)
    } catch (error) {
        next(error)
    }
}

export const videoStatusController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params
        const result = await mediasServices.getVideoStatusService(id)
        if (!result) {
            return res.status(httpStatus.NOT_FOUND).json({
                message: userMessages.videoStatusNotFound
            })
        }
        return res.json({
            message: userMessages.videoStatusFound,
            result
        })
    } catch (error) {
        next(error)
    }
}
