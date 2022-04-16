import {
    ATSerialPort,
    CommandResult,
    ExecutionOptions,
    RunCommandTimeoutError
} from './models';
import { Transform } from 'stream';

function defaultValidationPredicate(result: string[]): boolean {
    return result.some(line => line.toLowerCase().startsWith('ok'));
}
async function executeCommandAndParseResponse(
    commandName: string,
    command: () => Promise<number>,
    parser: Transform,
    {
        validation = defaultValidationPredicate,
        timeout = 5000
    }: ExecutionOptions
): Promise<CommandResult> {
    return new Promise((resolve, reject) => {
        const lastData: string[] = [];
        function parserListener(data: Buffer) {
            lastData.push(data.toString('utf8'));
            if (validation(lastData)) {
                clearTimeout(timeoutId);
                parser.removeListener('data', parserListener);
                return void resolve({ data: lastData, command: commandName });
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

export function buildCommandRunner(serialPort: ATSerialPort) {
    async function open() {
        await serialPort.open();
    }
    async function close() {
        await serialPort.close();
    }

    async function isOpen() {
        return serialPort.isOpen();
    }

    async function runCommand(cmd: string, options: ExecutionOptions = {}) {
        const command = async () => {
            return await serialPort.write(cmd + '\r\n');
        };
        return await executeCommandAndParseResponse(
            cmd,
            command,
            serialPort.read(),
            options
        );
    }

    return {
        open,
        close,
        isOpen,
        runCommand
    };
}
export type CommandRunner = ReturnType<typeof buildCommandRunner>;
