import { Request, Response, NextFunction } from 'express'
import path from 'path/win32'
import { UPLOAD_DIR } from '~/constants/dir'
import { userMessages } from '~/constants/messages'
import mediasServices from '~/services/medias.services'

export const uploadSingleImageController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const imgUrl = await mediasServices.uploadSingleImageService(req)
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
        return res.sendFile(path.resolve(UPLOAD_DIR, filename), (err) => {
            if (err) {
                next(err)
            }
        })
    } catch (error) {
        next(error)
    }
}
