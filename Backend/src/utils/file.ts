/* eslint-disable @typescript-eslint/no-unused-vars */
import path from 'path'
import fs from 'fs'
import formidable from 'formidable'
import { Request } from 'express'
import { File } from 'formidable'
import { UPLOAD_TEMP_DIR } from '~/constants/dir'

export const initFolder = () => {
    if (!fs.existsSync(UPLOAD_TEMP_DIR)) {
        fs.mkdirSync(UPLOAD_TEMP_DIR, {
            recursive: true
        })
    }
}

export const handleUploadImage = async (req: Request) => {
    const form = formidable({
        uploadDir: UPLOAD_TEMP_DIR,
        maxFiles: 4,
        keepExtensions: true,
        maxFileSize: 400 * 1024 * 4, // 400KB per image
        filter: function ({ name, mimetype }) {
            // allow only images
            const valid = name === 'image' && Boolean(mimetype?.includes('image/'))
            if (!valid) {
                form.emit('error' as any, new Error('Invalid file type') as any)
            }
            return true
        }
    })
    return new Promise<File[]>((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
            if (err) {
                reject(err)
            }
            if (!files || !files.image) {
                reject(new Error('No file uploaded'))
            }
            resolve(files.image as File[])
        })
    })
}
