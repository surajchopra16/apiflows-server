/**
 * Options type
 */

type Options = {
    /** The stack trace of the original error */
    stack?: string;

    /** The operational status of the error */
    isOperational?: boolean;
};

/**
 * The `HttpError` class extends the `Error` class for sending HTTP errors
 */

class HttpError extends Error {
    /** The status code of the error */
    readonly statusCode: number;

    /** The status of the error */
    readonly status: "fail" | "error";

    /** The operational status of the error */
    readonly isOperational: boolean;

    /**
     * Creates a new HttpError instance
     * @param message The message
     * @param statusCode The status code
     * @param options The options
     */

    constructor(message: string, statusCode: number, options: Options = {}) {
        super(message);

        this.statusCode = statusCode;
        this.status = statusCode.toString().startsWith("4") ? "fail" : "error";

        // HTTP errors are operational by default
        this.isOperational = options.isOperational ?? true;

        // If the original error stack is present, then assign it
        this.stack = options.stack ?? this.stack;
    }
}

export { HttpError };
