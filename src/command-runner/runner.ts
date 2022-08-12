import {
    CommandResult,
    ExecutionOptions,
    RunCommandTimeoutError
} from './models';
import { Transform } from 'stream';
import { ATSerialPort } from '../serialports';
import { Logger, silentLogger, debugLogger } from '../log-service';

function defaultValidationPredicate(result: string[]): boolean {
    return result.some(line => line.toLowerCase().startsWith('ok'));
}
async function executeCommandAndWaitResponse(
    commandName: string,
    command: () => Promise<number>,
    parser: Transform,
    {
        validation = defaultValidationPredicate,
        timeout = 5000,
        debug = false,
        logger = debug ? debugLogger : silentLogger
    }: ExecutionOptions
): Promise<CommandResult> {
    return new Promise((resolve, reject) => {
        const lastData: string[] = [];
        function parserListener(data: Buffer) {
            const nextLine = data.toString('utf8');
            logger.info(`[SerialPort] Received line ${nextLine}`);
            lastData.push(nextLine);
            try {
                if (validation(lastData)) {
                    clearTimeout(timeoutId);
                    parser.removeListener('data', parserListener);
                    parser.removeListener('error', reject);
                    return void resolve({
                        data: lastData,
                        command: commandName
                    });
                }
            } catch (error) {
                clearTimeout(timeoutId);
                parser.removeListener('data', parserListener);
                parser.removeListener('error', reject);
                return void reject(error);
            }
        }
        parser.on('error', reject);
        parser.on('data', parserListener);
        command();
        const timeoutId = setTimeout(() => {
            reject(new RunCommandTimeoutError(commandName, lastData));
            parser.removeListener('data', parserListener);
            parser.removeListener('error', reject);
        }, timeout);
    });
}

export type BuildCommandRunnerDeps = {
    debug?: boolean;
    serialPort: ATSerialPort;
    logger?: Logger;
};
export function buildCommandRunner({
    serialPort,
    debug = false,
    logger = debug ? debugLogger : silentLogger
}: BuildCommandRunnerDeps) {
    async function open() {
        await serialPort.open();
    }
    async function close() {
        await serialPort.close();
    }

    async function executeCommand(cmd: string, options: ExecutionOptions = {}) {
        logger.info('Executing Command', cmd);
        const executeOptions = { logger, debug, ...options };
        const command = async () => {
            return await serialPort.write(cmd + '\r\n');
        };
        return await executeCommandAndWaitResponse(
            cmd,
            command,
            serialPort.read(),
            executeOptions
        );
    }

    async function runCommand(commandFunction: () => Promise<CommandResult>) {
        try {
            await open();
            return await commandFunction();
        } finally {
            await close();
        }
    }

    async function runCommands(
        commandFunctions: (() => Promise<CommandResult>)[]
    ) {
        try {
            await open();
            const responses: CommandResult[] = [];
            for (const commandFunction of commandFunctions) {
                responses.push(await commandFunction());
            }
            return responses;
        } finally {
            await close();
        }
    }

    return {
        open,
        close,
        executeCommand,
        runCommand,
        runCommands
    };
}
export type CommandRunner = ReturnType<typeof buildCommandRunner>;
