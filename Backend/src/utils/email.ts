import { SendEmailCommand, SESClient } from '@aws-sdk/client-ses'
import {
    AWS_REGION,
    AWS_SECRET_ACCESS_KEY,
    AWS_ACCESS_KEY_ID,
    AWS_SENDER_EMAIL,
    CLIENT_URL
} from '../configs/env.config'

// Create SES service object.
const sesClient = new SESClient({
    region: AWS_REGION,
    credentials: {
        secretAccessKey: AWS_SECRET_ACCESS_KEY as string,
        accessKeyId: AWS_ACCESS_KEY_ID as string
    }
})

const createSendEmailCommand = ({
    fromAddress,
    toAddresses,
    ccAddresses = [],
    body,
    subject,
    replyToAddresses = []
}: {
    fromAddress: string
    toAddresses: string | string[]
    ccAddresses?: string | string[]
    body: string
    subject: string
    replyToAddresses?: string | string[]
}) => {
    return new SendEmailCommand({
        Destination: {
            /* required */
            CcAddresses: ccAddresses instanceof Array ? ccAddresses : [ccAddresses],
            ToAddresses: toAddresses instanceof Array ? toAddresses : [toAddresses]
        },
        Message: {
            /* required */
            Body: {
                /* required */
                Html: {
                    Charset: 'UTF-8',
                    Data: body
                }
            },
            Subject: {
                Charset: 'UTF-8',
                Data: subject
            }
        },
        Source: fromAddress,
        ReplyToAddresses: replyToAddresses instanceof Array ? replyToAddresses : [replyToAddresses]
    })
}

export const sendVerifyEmail = (toAddress: string, email_verify_token: string) => {
    const sendEmailCommand = createSendEmailCommand({
        fromAddress: AWS_SENDER_EMAIL as string,
        toAddresses: toAddress,
        subject: 'Verify Your Kwitter Account',
        body: `<!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        color: #333333;
                        max-width: 600px;
                        margin: 0 auto;
                    }
                    .email-container {
                        border: 1px solid #e1e8ed;
                        border-radius: 12px;
                        overflow: hidden;
                        margin: 20px auto;
                    }
                    .email-header {
                        background-color: #1DA1F2;
                        padding: 20px;
                        text-align: center;
                    }
                    .email-header h1 {
                        color: white;
                        margin: 0;
                        font-size: 24px;
                    }
                    .email-body {
                        padding: 20px;
                        background-color: #ffffff;
                    }
                    .email-footer {
                        background-color: #f5f8fa;
                        padding: 15px;
                        text-align: center;
                        font-size: 12px;
                        color: #657786;
                    }
                    .btn {
                        display: inline-block;
                        padding: 10px 20px;
                        background-color: #1DA1F2;
                        color: white;
                        text-decoration: none;
                        border-radius: 30px;
                        font-weight: bold;
                        margin: 20px 0;
                    }
                    .btn:hover {
                        background-color: #0d8fd9;
                    }
                </style>
            </head>
            <body>
                <div class="email-container">
                    <div class="email-header">
                        <h1>Welcome to Kwitter!</h1>
                    </div>
                    <div class="email-body">
                        <p>Hi there,</p>
                        <p>Thanks for signing up! Please verify your email address to complete your registration and get started with Kwitter.</p>
                        <div style="text-align: center;">
                            <a href="${CLIENT_URL}/verify-email?token=${email_verify_token}" class="btn">Verify My Email</a>
                        </div>
                        <p>This link will expire in 24 hours.</p>
                    </div>
                    <div class="email-footer">
                        <p>© ${new Date().getFullYear()} Kwitter. All rights reserved.</p>
                        <p>If you didn't create an account with us, please ignore this email.</p>
                    </div>
                </div>
            </body>
            </html>`
    })
    return sesClient.send(sendEmailCommand)
}

export const sendResetPasswordEmail = (toAddress: string, forgot_password_token: string) => {
    const sendEmailCommand = createSendEmailCommand({
        fromAddress: AWS_SENDER_EMAIL as string,
        toAddresses: toAddress,
        subject: 'Reset Your Kwitter Password',
        body: `<!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        color: #333333;
                        max-width: 600px;
                        margin: 0 auto;
                    }
                    .email-container {
                        border: 1px solid #e1e8ed;
                        border-radius: 12px;
                        overflow: hidden;
                        margin: 20px auto;
                    }
                    .email-header {
                        background-color: #1DA1F2;
                        padding: 20px;
                        text-align: center;
                    }
                    .email-header h1 {
                        color: white;
                        margin: 0;
                        font-size: 24px;
                    }
                    .email-body {
                        padding: 20px;
                        background-color: #ffffff;
                    }
                    .email-footer {
                        background-color: #f5f8fa;
                        padding: 15px;
                        text-align: center;
                        font-size: 12px;
                        color: #657786;
                    }
                    .btn {
                        display: inline-block;
                        padding: 10px 20px;
                        background-color: #1DA1F2;
                        color: white;
                        text-decoration: none;
                        border-radius: 30px;
                        font-weight: bold;
                        margin: 20px 0;
                    }
                    .btn:hover {
                        background-color: #0d8fd9;
                    }
                    .security-note {
                        background-color: #f8f9fa;
                        border-left: 4px solid #ffd700;
                        padding: 12px;
                        margin: 20px 0;
                    }
                </style>
            </head>
            <body>
                <div class="email-container">
                    <div class="email-header">
                        <h1>Password Reset Request</h1>
                    </div>
                    <div class="email-body">
                        <p>Hello,</p>
                        <p>We received a request to reset your password for your Kwitter account. If you didn't make this request, you can safely ignore this email.</p>
                        
                        <div class="security-note">
                            <strong>Security Tip:</strong> We will never ask you for your password via email.
                        </div>
                        
                        <p>To reset your password, click the button below:</p>
                        
                        <div style="text-align: center;">
                            <a href="${CLIENT_URL}/reset-password?token=${forgot_password_token}" class="btn">Reset My Password</a>
                        </div>
                        
                        <p>This link will expire in 24 hours for security reasons.</p>
                    </div>
                    <div class="email-footer">
                        <p>© ${new Date().getFullYear()} Kwitter. All rights reserved.</p>
                        <p>If you didn't request a password reset, please contact support immediately.</p>
                    </div>
                </div>
            </body>
            </html>`
    })
    return sesClient.send(sendEmailCommand)
}
