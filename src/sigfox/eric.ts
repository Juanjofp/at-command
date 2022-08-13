import {
    ATSerialPort,
    CommandRunnerBuilder,
    CommandRunnerDeps,
    debugLogger,
    silentLogger,
    ExecutorCommand,
    CommandResult
} from '../';
import { validateFrameOrThrow, validateOrThrowError } from './validators';

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
    }: CommandRunnerDeps
) {
    function generateSingleLineCommand(command: string) {
        return (executor: ExecutorCommand) =>
            executor(command, {
                timeout: commandTimeout,
                validation: parseValidSingleLineResponseOrThrow
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
            await runner.runCommand(executor => {
                return executor(`AT$SF=${frame}`, {
                    timeout,
                    validation: () => false
                });
            });
        } catch (error) {
            logger.error('[Sigfox ERIC]', 'sendData (AT$SF)', `${error}`);
            throw new Error(`Cannot send frame AT$SF=${data}`);
        }
    }

    return {
        getVersion,
        getInformation,
        sendData
    };
}

export type ERIC = ReturnType<typeof buildEric>;

function parseValidSingleLineResponseOrThrow(data: string[]) {
    validateOrThrowError(data, ['err', 'atcmd_not_supported']);
    return data.length === 1;
}
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
