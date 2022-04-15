import { ATSerialPort } from './models';
import { Transform } from 'stream';

async function executeCommandAndParseResponse(
    command: () => Promise<number>,
    parser: Transform,
    validation = 'ok'
) {
    return new Promise((resolve, reject) => {
        let lastData = '';
        function parserListener(data: string) {
            console.log('Response cmd parsed:', data);
            lastData = data;
            if (data.toLowerCase().startsWith(validation)) {
                resolve(data);
                parser.removeListener('data', parserListener);
                return;
            }
        }
        parser.on('data', parserListener);
        command();
        setTimeout(() => {
            reject(new Error(`Last data received: ${lastData}`));
            parser.removeListener('data', parserListener);
        }, 5000);
    });
}

export function buildCommandRunner(serialPort: ATSerialPort) {
    serialPort.read().on('data', function (data: string) {
        console.log('Global Data:', data);
    });

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

    async function runCommand(cmd: string, validation = 'ok') {
        const command = async () => {
            return await serialPort.write(cmd + '\r\n');
        };
        return await executeCommandAndParseResponse(
            command,
            serialPort.read(),
            validation
        );
    }

    return {
        open,
        close,
        runCommand
    };
}
export type CommandRunner = ReturnType<typeof buildCommandRunner>;
