import { ATSerialPort, RunCommandTimeoutError } from './models';
import { Transform } from 'stream';

export type ExecutionOptions = { validation?: string; timeout?: number };
async function executeCommandAndParseResponse(
    commandName: string,
    command: () => Promise<number>,
    parser: Transform,
    { validation = 'ok', timeout = 5000 }: ExecutionOptions = {}
) {
    return new Promise((resolve, reject) => {
        let lastData = '';
        function parserListener(data: string) {
            lastData = data;
            if (data.toLowerCase().startsWith(validation)) {
                clearTimeout(timeoutId);
                parser.removeListener('data', parserListener);
                return void resolve({ data, command: commandName });
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
    // Open errors will be emitted as an error event
    // serialPort.on('error', function (err) {
    //     console.log('Error: ', err.message);
    // });

    // const res0 = await runCommand('at+version', serialPort, parser);
    // console.log('Command Result at+version', res0);
    // serialPort.close();

    async function open() {
        await serialPort.open();
    }
    async function close() {
        await serialPort.close();
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
        runCommand
    };
}
export type CommandRunner = ReturnType<typeof buildCommandRunner>;
