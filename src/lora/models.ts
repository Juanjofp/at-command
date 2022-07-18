import { CommandRunner } from '../command-runner';
import { Logger } from '../logger';

export type LoraDeps = {
    logger?: Logger;
    runner?: CommandRunner;
    commandTimeout?: number;
};

export const LoraModels = {
    RAK811: 'RAK811',
    RAK11300: 'RAK11300'
} as const;
export type LoraModels = typeof LoraModels[keyof typeof LoraModels];

const Rak811ErrorCodes: Record<string, string> = {
    '1': 'The last command received is an unsupported AT command',
    '2': 'Invalid parameter in the AT command',
    '96': 'Time out reached while waiting for a packet in the LoRa RX2 window',
    '99': 'Failed to join into a LoRa network'
};
const Rak11300ErrorCodes: Record<string, string> = {
    '1': 'Generic error or invalid input',
    '2': 'Command not supported',
    '5': 'Invalid parameter in the AT command',
    '6': 'Parameter too long',
    '8': 'Value out of range'
};

const ErrorCodes = {
    [LoraModels.RAK811]: Rak811ErrorCodes,
    [LoraModels.RAK11300]: Rak11300ErrorCodes
};
function getErrorCodeMessage(model: LoraModels, error: string): string {
    return ErrorCodes[model][error] || `Unknown error code ${error}`;
}
export class LoraResponseError extends Error {
    private readonly model: LoraModels;
    private readonly errorCode: number;
    private readonly errorMessage: string;

    constructor(
        errorCodeString: string,
        model: LoraModels = LoraModels.RAK811
    ) {
        const msg = getErrorCodeMessage(model, errorCodeString);
        super(`Lora error code ${errorCodeString}: ${msg}`);
        this.name = 'LoraResponseError';
        this.model = model;
        this.errorCode = parseInt(errorCodeString, 10);
        this.errorMessage = msg;
    }

    getLoraError() {
        return {
            model: this.model,
            code: this.errorCode,
            description: this.errorMessage
        };
    }
}
