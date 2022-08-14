export function validateOrThrowError(data: string[], errors = ['err']) {
    data.forEach(response => {
        errors.forEach(error => {
            if (response.toLowerCase().startsWith(error.toLowerCase())) {
                throw new Error(`Invalid command response: ${data[0]}`);
            }
        });
    });
}

export function validateOKResponseOrThrow(data: string[], errors = ['err']) {
    validateOrThrowError(data, errors);
    return data.some(line => line.toLowerCase().startsWith('ok'));
}

export function validateSingleLineResponseOrThrow(
    data: string[],
    errors = ['err']
) {
    validateOrThrowError(data, errors);
    return data.length === 1;
}

export function validateFrameOrThrow(data: string) {
    const errorMessage = `Cannot send frame AT$SF=${data}`;
    if (!data) throw new Error(`${errorMessage}. Invalid empty frame`);
    const frameSize = data.length;
    if (frameSize > 24)
        throw new Error(`${errorMessage}. Frame size exceed 12 bytes`);
    if (frameSize % 2 !== 0)
        throw new Error(
            `${errorMessage}. Invalid frame size (${data.length} chars)`
        );
    const isHexadecimal = new RegExp(`[0-9A-Fa-f]{${frameSize}}`);
    if (!isHexadecimal.test(data))
        throw new Error(`${errorMessage}. Frame must be hexadecimal`);
    return data;
}

export function validateResponseAndWaitOrThrow(
    data: string[],
    endString = '+rx end',
    errors = ['err']
) {
    validateOrThrowError(data, errors);
    return data.some(line => line.toLowerCase().startsWith(endString));
}
