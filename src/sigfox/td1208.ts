import type { ATSerialPort } from '../serialports';
import { CommandRunnerBuilder } from '../command-runner';
import { debugLogger, silentLogger } from '../log-service';
import { CommandRunnerDeps } from '../models';
import { validateOrThrowError, validateFrameOrThrow } from './validators';

export function buildTD1208(
    serialPort: ATSerialPort,
    {
        debug = false,
        logger = debug ? debugLogger : silentLogger,
        runner = CommandRunnerBuilder.buildCommandRunner({
            serialPort,
            debug,
            logger
        }),
        commandTimeout = 3000
    }: CommandRunnerDeps = {}
) {
    async function getVersion() {
        const command = async () =>
            await runner.executeCommand('ati5', {
                timeout: commandTimeout,
                validation: parseValidResponseOrThrow
            });

        try {
            const response = await runner.runCommand(command);
            const version = parseVersionOrThrow(response.data);
            logger.info('Get version', version);
            return version;
        } catch (error) {
            logger.error('[Sigfox TD1208]', 'getVersion (ati5)', `${error}`);
            throw new Error('Cannot get version');
        }
    }

    async function runInformationCommand() {
        return runner.executeCommand('AT&V', {
            timeout: commandTimeout,
            validation: parseValidResponseOrThrow
        });
    }
    async function getInformation() {
        try {
            const response = await runner.runCommand(runInformationCommand);
            return parseInformation(response.data);
        } catch (error) {
            logger.error(
                '[Sigfox TD1208]',
                'getInformation (AT&V)',
                `${error}`
            );
            throw new Error('Cannot get information');
        }
    }

    async function runSendDataCommand(data: string, timeout: number) {
        return runner.executeCommand(`AT$SF=${data}`, {
            timeout,
            validation: parseValidResponseOrThrow
        });
    }
    async function sendData(data: string, { timeout = commandTimeout } = {}) {
        const frame = validateFrameOrThrow(data);
        try {
            await runner.runCommand(() => runSendDataCommand(frame, timeout));
        } catch (error) {
            logger.error('[Sigfox TD1208]', 'sendData (AT$SF)', `${error}`);
            throw new Error(`Cannot send frame AT$SF=${data}`);
        }
    }

    async function runSendDataCommandAndWait(data: string, timeout: number) {
        return runner.executeCommand(`AT$SF=${data},2,1`, {
            timeout,
            validation: parseValidResponseAndWaitOrThrow
        });
    }
    async function sendDataAndWaitForResponse(
        data: string,
        { timeout = commandTimeout } = {}
    ) {
        const frame = validateFrameOrThrow(data);
        try {
            const response = await runner.runCommand(() =>
                runSendDataCommandAndWait(frame, timeout)
            );
            return parseDataResponseOrThrow(response.data);
        } catch (error) {
            logger.error(
                '[Sigfox TD1208]',
                'sendDataAndWait (AT$SF,2,1)',
                `${error}`
            );
            throw new Error(`Cannot send frame AT$SF=${data},2,1`);
        }
    }
    return {
        getVersion,
        getInformation,
        sendData,
        sendDataAndWaitForResponse
    };
}

export type SigfoxTD1208 = ReturnType<typeof buildTD1208>;

function parseValidResponseOrThrow(data: string[]) {
    validateOrThrowError(data);
    return data.some(line => line.toLowerCase().startsWith('ok'));
}
function parseValidResponseAndWaitOrThrow(data: string[]) {
    validateOrThrowError(data);
    return data.some(line => line.toLowerCase().startsWith('+rx end'));
}
function parseVersionOrThrow(data: string[]) {
    if (data.length !== 3 || !data[1])
        throw new Error(`Invalid version received ${data[1]}`);
    return data[1];
}
function parseFieldOrThrow(
    data: string,
    fieldName: string,
    fieldPosition = 1,
    fieldSeparator = ':'
) {
    try {
        return data.split(fieldSeparator)[fieldPosition].trim();
    } catch (error) {
        throw new Error(`Invalid field ${fieldName}. ${error}`);
    }
}
function parseInformation(data: string[]) {
    const model = data[1];
    const hardwareVersion = parseFieldOrThrow(data[2], 'hardware version');
    const softwareVersion = parseFieldOrThrow(data[3], 'software version');
    const deviceId = parseFieldOrThrow(data[4], 'deviceId');
    const serialNumber = parseFieldOrThrow(data[5], 'serial number');

    const values = data[7].split(' ');
    const freq = values.find(v => v.startsWith('S403'));
    let region = 'EU';
    if (freq) {
        const freqValue = freq.split(':')[1];
        if (freqValue.startsWith('8')) {
            region = 'EU868';
        } else {
            region = 'US915';
        }
    }

    return {
        model,
        hardwareVersion,
        softwareVersion,
        deviceId,
        serialNumber,
        region
    };
}

function parseDataResponseOrThrow(data: string[]) {
    const responseString = data[3];
    const responseDataString = responseString.trimEnd().split('=')[1];
    if (!responseDataString) return [];
    return responseDataString.split(' ').map(value => parseInt(value, 16));
}
