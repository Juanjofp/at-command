const ErrorCodes: Record<string, string> = {
    '2': 'Invalid parameter in the AT command'
};
export class LoraResponseError extends Error {
    private readonly errorCode: number;
    private readonly errorMessage: string;

    constructor(errorCodeString: string) {
        const msg = ErrorCodes[errorCodeString] || 'Unknown error code';
        super(`Lora error code ${errorCodeString}: ${msg}`);
        this.name = 'LoraResponseError';
        this.errorCode = parseInt(errorCodeString, 10);
        this.errorMessage = msg;
    }

    getLoraError() {
        return {
            code: this.errorCode,
            description: this.errorMessage
        };
    }
}
