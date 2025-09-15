import path from 'path'
import fs from 'fs'
import formidable from 'formidable'
import { Request } from 'express'
import { File } from 'formidable'
import { UPLOAD_IMAGE_TEMP_DIR, UPLOAD_VIDEO_DIR, UPLOAD_VIDEO_TEMP_DIR } from '~/constants/dir'
import { nanoid } from 'nanoid'

export const initFolder = () => {
    if (!fs.existsSync(UPLOAD_IMAGE_TEMP_DIR)) {
        fs.mkdirSync(UPLOAD_IMAGE_TEMP_DIR, {
            recursive: true
        })
    }
    if (!fs.existsSync(UPLOAD_VIDEO_TEMP_DIR)) {
        fs.mkdirSync(UPLOAD_VIDEO_TEMP_DIR, {
            recursive: true
        })
    }
}

export const handleUploadImage = async (req: Request) => {
    const form = formidable({
        uploadDir: UPLOAD_IMAGE_TEMP_DIR,
        maxFiles: 4,
        keepExtensions: true,
        maxFileSize: 3 * 1024 * 1024, // 3MB per image
        maxTotalFileSize: 12 * 1024 * 1024, // 12MB total
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

export const handleUploadVideo = async (req: Request) => {
    const form = formidable({
        uploadDir: UPLOAD_VIDEO_DIR,
        maxFiles: 4,
        keepExtensions: true,
        maxFileSize: 50 * 1024 * 1024 * 4, // 50MB per video
        filter: function ({ name, mimetype }) {
            // allow only videos
            const valid = name === 'video' && Boolean(mimetype?.includes('video/'))
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
            if (!files || !files.video) {
                reject(new Error('No file uploaded'))
            }
            const videos = files.video as File[]
            videos.forEach((video) => {
                const newPath = video.filepath.replace(/\.[^/.]+$/, '.mp4')
                fs.renameSync(video.filepath, newPath)
                // Update the object properties to match the renamed file
                video.filepath = newPath
                video.newFilename = video.newFilename.replace(/\.[^/.]+$/, '.mp4')
            })
            resolve(videos)
        })
    })
}

export const handleUploadVideoHLS = async (req: Request) => {
    const idName = nanoid()
    const folderPath = path.resolve(UPLOAD_VIDEO_DIR, idName)
    fs.mkdirSync(folderPath, {
        recursive: true
    })
    const form = formidable({
        uploadDir: folderPath,
        maxFiles: 4,
        keepExtensions: true,
        maxFileSize: 50 * 1024 * 1024 * 4, // 50MB per video
        filter: function ({ name, mimetype }) {
            // allow only videos
            const valid = name === 'video' && Boolean(mimetype?.includes('video/'))
            if (!valid) {
                form.emit('error' as any, new Error('Invalid file type') as any)
            }
            return true
        },
        filename: function () {
            return `${idName}`
        }
    })
    return new Promise<File[]>((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
            if (err) {
                reject(err)
            }
            if (!files || !files.video) {
                reject(new Error('No file uploaded'))
            }
            const videos = files.video as File[]
            videos.forEach((video) => {
                const newPath = video.filepath.replace(/\.[^/.]+$/, '.mp4')
                fs.renameSync(video.filepath, newPath)
                // Update the object properties to match the renamed file
                video.filepath = newPath
                video.newFilename = video.newFilename.replace(/\.[^/.]+$/, '.mp4')
            })
            resolve(videos)
        })
    })
}

export const getFilesFromDir = (dir: string, files: string[] = []) => {
    const fileList = fs.readdirSync(dir)
    for (const file of fileList) {
        const name = `${dir}/${file}`
        // check if the current file/directory is a directory
        if (fs.statSync(name).isDirectory()) {
            // if yes, recursively call the function to get all files in the directory
            getFilesFromDir(name, files)
        } else {
            // if no, push the file name to the array
            files.push(name)
        }
    }
    return files
}
