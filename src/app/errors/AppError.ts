export default class AppError extends Error {

    public statusCode

    constructor(statusCode: number, message: string, stack = "") {
        super(message)
        this.statusCode = statusCode
        if (stack) {
            this.stack = stack
        }
        else {
            Error.captureStackTrace(this, this.constructor)
        }
    }
}