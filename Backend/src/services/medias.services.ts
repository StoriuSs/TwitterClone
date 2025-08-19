import { Request } from 'express'
import { handleUploadImage, handleUploadVideo } from '~/utils/file'
import sharp from 'sharp'
import path from 'path'
import { UPLOAD_IMAGE_DIR } from '~/constants/dir'
import { HOST, NODE_ENV, PORT } from '~/configs/env.config'
import fs from 'fs'
import { MediaType } from '~/constants/enum'
import { Media } from '~/models/schemas/Media.schema'

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
}
const mediasServices = new MediasServices()
export default mediasServices
