export class ErrorsWithStatus {
    message: string
    status: number
    constructor(message: string, status: number) {
        this.message = message
        this.status = status
    }
}
