import { S3 } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET_NAME } from '~/configs/env.config'
import fs from 'fs'
import { Response } from 'express'
import httpStatus from '~/constants/httpStatus'

const clientS3 = new S3({
    region: AWS_REGION,
    credentials: {
        secretAccessKey: AWS_SECRET_ACCESS_KEY as string,
        accessKeyId: AWS_ACCESS_KEY_ID as string
    }
})

export const uploadFileToS3 = ({
    filename,
    filepath,
    contentType
}: {
    filename: string
    filepath: string
    contentType: string
}) => {
    const parallelUploads3 = new Upload({
        client: clientS3,
        params: {
            Bucket: AWS_S3_BUCKET_NAME,
            Key: filename,
            Body: fs.readFileSync(filepath),
            ContentType: contentType
        },

        // (optional) concurrency configuration
        queueSize: 4,
        // (optional) size of each part, in bytes, at least 5MB
        partSize: 1024 * 1024 * 5,
        leavePartsOnError: false
    })
    return parallelUploads3.done()
}

export const serveFileFromS3 = async (res: Response, filepath: string) => {
    try {
        const data = await clientS3.getObject({
            Bucket: AWS_S3_BUCKET_NAME as string,
            Key: filepath
        })
        ;(data.Body as any).pipe(res)
    } catch (error) {
        console.error('Error serving file from S3:', error)
        res.sendStatus(httpStatus.INTERNAL_SERVER_ERROR)
    }
}
