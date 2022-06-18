import { LoraModels, LoraResponseError } from '@/lora/models';

export function trimValue(line: string) {
    return line.split(':')[1].trim() || 'unknown';
}
export function validateOrThrowError(
    data: string[],
    errorMessage: string,
    model: LoraModels
) {
    data.forEach(response => {
        if (response.toLowerCase().startsWith(errorMessage)) {
            const errorCode = trimValue(response);
            throw new LoraResponseError(errorCode, model);
        }
    });
}
export function validateCommand(
    data: string[],
    errorMessage = 'error',
    model: LoraModels = LoraModels.RAK811
) {
    if (data.length > 0) {
        // console.log('validate Data', data);
        validateOrThrowError(data, errorMessage, model);
        for (const response of data) {
            if (response.toLowerCase().startsWith('ok')) {
                return true;
            }
        }
    }
    return false;
}

export function waitForReceivedValidation(
    data: string[],
    errorMessage = 'error',
    model: LoraModels = LoraModels.RAK811
) {
    validateOrThrowError(data, errorMessage, model);
    if (data.length >= 2) {
        const [result, message] = data;
        if (
            result.toLowerCase().startsWith('ok') &&
            message.toLowerCase().startsWith('at+recv=')
        ) {
            return true;
        }
    }
    return false;
}
