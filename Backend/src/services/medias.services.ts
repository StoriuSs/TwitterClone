import { Request } from 'express'
import { handleUploadSingleImage } from '~/utils/file'
import sharp from 'sharp'
import path from 'path'
import { UPLOAD_DIR } from '~/constants/dir'
import { HOST, NODE_ENV, PORT } from '~/configs/env.config'
import fs from 'fs'

class MediasServices {
    async uploadSingleImageService(req: Request) {
        // create the temp uploaded image
        const file = await handleUploadSingleImage(req)
        // Create permanent filename and path
        const newName = file.newFilename.replace(/\.[^/.]+$/, '.jpg')
        const newPath = path.join(UPLOAD_DIR, newName)
        // Process with Sharp and save directly to uploads folder
        await sharp(file.filepath).jpeg().toFile(newPath)

        // Clean up temp file
        fs.unlinkSync(file.filepath)
        return NODE_ENV === 'production' ? `${HOST}/static/${newName}` : `http://localhost:${PORT}/static/${newName}`
    }
}
const mediasServices = new MediasServices()
export default mediasServices
