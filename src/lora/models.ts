import { CommandRunner } from '@/command-runner';

export type LoraDeps = {
    runner?: CommandRunner;
    commandTimeout?: number;
};

const ErrorCodes: Record<string, string> = {
    '1': 'The last command received is an unsupported AT command',
    '2': 'Invalid parameter in the AT command',
    '96': 'Time out reached while waiting for a packet in the LoRa RX2 window',
    '99': 'Failed to join into a LoRa network'
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
