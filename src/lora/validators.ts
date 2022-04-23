import { LoraResponseError } from '@/lora/models';

export function trimValue(line: string) {
    return line.split(':')[1].trim() || 'unknown';
}
export function validateOrThrowError(data: string[], errorMessage = 'error') {
    data.forEach(response => {
        if (response.toLowerCase().startsWith(errorMessage)) {
            const errorCode = trimValue(response);
            throw new LoraResponseError(errorCode);
        }
    });
}
export function validateCommand(data: string[], errorMessage = 'error') {
    if (data.length > 0) {
        console.log(data);
        validateOrThrowError(data, errorMessage);
        for (const response of data) {
            if (response.toLowerCase().startsWith('ok')) {
                return true;
            }
        }
    }
    return false;
}

export function waitForReceivedValidation(data: string[]) {
    validateOrThrowError(data);
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
