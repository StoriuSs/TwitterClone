import { Request, Response, NextFunction } from 'express'
import path from 'path'
import { UPLOAD_IMAGE_DIR, UPLOAD_VIDEO_DIR } from '~/constants/dir'
import { userMessages } from '~/constants/messages'
import mediasServices from '~/services/medias.services'

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

export const serveVideoController = (req: Request, res: Response, next: NextFunction) => {
    try {
        const filename = req.params.filename
        const videoPath = path.resolve(UPLOAD_VIDEO_DIR, filename)

        // Set content type for videos
        res.setHeader('Content-Type', 'video/mp4')

        // Set Content-Disposition to 'inline' to encourage browsers to play the video
        res.setHeader('Content-Disposition', 'inline')

        res.sendFile(videoPath, (err) => {
            if (err && !res.headersSent) {
                console.error('Error serving video:', err)
            }
        })
    } catch (error) {
        // Only call next if we haven't sent any response yet
        if (!res.headersSent) {
            next(error)
        }
    }
}
