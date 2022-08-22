import {
    ATSerialPort,
    CommandRunnerBuilder,
    CommandRunnerDeps,
    debugLogger,
    silentLogger,
    ExecutorCommand,
    CommandResult
} from '../';
import {
    validateFrameOrThrow,
    validateOKResponseOrThrow,
    validateResponseAndWaitOrThrow,
    validateSingleLineResponseOrThrow
} from './validators';

export function buildEric(
    serialPort: ATSerialPort,
    {
        debug = false,
        logger = debug ? debugLogger : silentLogger,
        runner = CommandRunnerBuilder.buildCommandRunner({
            serialPort,
            debug,
            logger
        }),
        commandTimeout = 30000
    }: CommandRunnerDeps = {}
) {
    function generateSingleLineCommand(command: string) {
        return (executor: ExecutorCommand) =>
            executor(command, {
                timeout: commandTimeout,
                validation: validateSingleLineResponseOrThrowWithCustomErrors
            });
    }

    function getVersionCommands() {
        return [
            generateSingleLineCommand('AT$I=4'),
            generateSingleLineCommand('AT$I=5'),
            generateSingleLineCommand('AT$I=8')
        ];
    }
    async function getVersion() {
        try {
            const responses = await runner.runCommands(getVersionCommands());
            const version = parseVersionOrThrow(responses);
            logger.info('Get version', version);
            return version;
        } catch (error) {
            logger.error(
                '[Sigfox ERIC]',
                'getVersion (AT$I=4,5,8)',
                `${error}`
            );
            throw new Error(`Cannot get version: ${error}`);
        }
    }

    function getInformationCommands() {
        return [
            generateSingleLineCommand('AT$I=0'),
            generateSingleLineCommand('AT$I=10'),
            generateSingleLineCommand('AT$I=11'),
            generateSingleLineCommand('AT$IF?')
        ];
    }
    async function getInformation() {
        try {
            const responses = await runner.runCommands(
                getInformationCommands()
            );
            return parseInformation(responses);
        } catch (error) {
            logger.error(
                '[Sigfox ERIC]',
                'getInformation (AT$I=0,10,11)',
                `${error}`
            );
            throw new Error(`Cannot get information: ${error}`);
        }
    }

    async function sendData(data: string, { timeout = commandTimeout } = {}) {
        const frame = validateFrameOrThrow(data);
        try {
            await runner.runCommand(
                generateSendDataCommand(frame, { timeout })
            );
        } catch (error) {
            logger.error(
                '[Sigfox ERIC]',
                `sendData (AT$SF=${data},0)`,
                `${error}`
            );
            throw new Error(`Cannot send frame AT$SF=${data},0`);
        }
    }

    async function sendDataAndWaitForResponse(
        data: string,
        { timeout = commandTimeout } = {}
    ) {
        const frame = validateFrameOrThrow(data);
        try {
            const response = await runner.runCommand(
                generateSendDataCommand(frame, {
                    timeout,
                    waitForResponse: true
                })
            );
            return parseDataResponseOrThrow(response);
        } catch (error) {
            logger.error(
                '[Sigfox ERIC]',
                `sendData (AT$SF=${data},1)`,
                `${error}`
            );
            throw new Error(`Cannot send frame AT$SF=${data},1`);
        }
    }

    return {
        getVersion,
        getInformation,
        sendData,
        sendDataAndWaitForResponse
    };
}

function generateSendDataCommand(
    frame: string,
    {
        waitForResponse = false,
        timeout = 10000
    }: {
        waitForResponse?: boolean;
        timeout?: number;
    } = {}
) {
    return (executor: ExecutorCommand) => {
        const validation = waitForResponse
            ? validateDataResponseOrThrowWithCustomErrors
            : validateOkResponseOrThrowWithCustomErrors;
        return executor(`AT$SF=${frame}${waitForResponse ? ',1' : ',0'}`, {
            timeout,
            validation
        });
    };
}

const ericErrors = ['err', 'atcmd_not_supported'];
export type SigfoxERIC = ReturnType<typeof buildEric>;

// Validators
function validateSingleLineResponseOrThrowWithCustomErrors(data: string[]) {
    return validateSingleLineResponseOrThrow(data, ericErrors);
}
function validateOkResponseOrThrowWithCustomErrors(data: string[]) {
    return validateOKResponseOrThrow(data, ericErrors);
}
function validateDataResponseOrThrowWithCustomErrors(data: string[]) {
    return validateResponseAndWaitOrThrow(data, 'rx=', ericErrors);
}

// Parsers
function parseVersionOrThrow(data: CommandResult[]) {
    if (data.length !== 3) throw new Error(`Invalid version received ${data}`);
    return data.map(commandResult => commandResult.data[0]).join('.');
}
function extractResultForCommand(
    data: CommandResult[],
    command: string,
    defaultValue: string
) {
    const commandResult = data.find(
        commandResult => commandResult.command === command
    );
    if (!commandResult) {
        return defaultValue;
    }
    if (!commandResult.data[0]) {
        return defaultValue;
    }
    return commandResult.data[0];
}
function parseInformation(data: CommandResult[]) {
    const information = {
        model: 'unknown',
        softwareVersion: 'unknown',
        hardwareVersion: 'unknown',
        deviceId: 'unknown',
        serialNumber: 'unknown',
        region: 'unknown'
    };

    const modelAndVersionString = extractResultForCommand(
        data,
        'AT$I=0',
        'unknown unknown'
    );
    if (modelAndVersionString) {
        const [model, version] = modelAndVersionString.split(' ');
        information.model = model || information.model;
        information.softwareVersion = version || information.softwareVersion;
    }

    information.deviceId = extractResultForCommand(
        data,
        'AT$I=10',
        information.deviceId
    );

    information.serialNumber = extractResultForCommand(
        data,
        'AT$I=11',
        information.serialNumber
    );

    const frequencyCommand = extractResultForCommand(data, 'AT$IF?', 'unknown');
    const frequency = parseInt(frequencyCommand) / 1000000;
    information.region =
        frequency < 900
            ? 'EU868'
            : frequency > 900
            ? 'US915'
            : information.region;

    return information;
}
function parseDataResponseOrThrow({ data }: CommandResult) {
    if (data[0] !== 'OK') throw new Error(`Invalid response data ${data[0]}`);
    const responseString = data[1];
    const responseDataString = responseString.trimEnd().split('=')[1];
    if (!responseDataString) return [];
    return responseDataString.split(' ').map(value => parseInt(value, 16));
}
