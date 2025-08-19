import { Request } from 'express'
import { handleUploadImage } from '~/utils/file'
import sharp from 'sharp'
import path from 'path'
import { UPLOAD_DIR } from '~/constants/dir'
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
                const newPath = path.join(UPLOAD_DIR, newName)
                // Process with Sharp and save directly to uploads folder
                await sharp(file.filepath).jpeg().toFile(newPath)
                // Clean up temp file
                fs.unlinkSync(file.filepath)
                return {
                    url:
                        NODE_ENV === 'production'
                            ? `${HOST}/static/${newName}`
                            : `http://localhost:${PORT}/static/${newName}`,
                    type: MediaType.Image
                }
            })
        )
        return result
    }
}
const mediasServices = new MediasServices()
export default mediasServices
