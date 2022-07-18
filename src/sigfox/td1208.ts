import type { ATSerialPort } from '../serialports';
import { CommandRunner, CommandRunnerBuilder } from '../command-runner';
import { Logger, silentLogger } from '../log-service';

export type SigfoxDeps = {
    logger?: Logger;
    runner?: CommandRunner;
    commandTimeout?: number;
};
export function buildTD1208(
    serialPort: ATSerialPort,
    {
        logger = silentLogger,
        runner = CommandRunnerBuilder.buildCommandRunner({
            serialPort,
            logger
        }),
        commandTimeout = 3000
    }: SigfoxDeps = {}
) {
    async function getVersion() {
        const command = async () =>
            await runner.executeCommand('ati5', {
                timeout: commandTimeout
            });

        const response = await runner.runCommand(command);
        console.log(response);
        logger.info('Get version');
        return response.data[1];
    }

    function parseInformation(data: string[]) {
        const model = data[1];
        const hardwareVersion = data[2].split(':')[1].trim();
        const softwareVersion = data[3].split(':')[1].trim();
        const deviceId = data[4].split(':')[1].trim();
        const serialNumber = data[5].split(':')[1].trim();

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
    async function runInformationCommand() {
        return runner.executeCommand('AT&V', {
            timeout: commandTimeout
        });
    }
    async function getInformation() {
        const response = await runner.runCommand(runInformationCommand);
        return parseInformation(response.data);
    }

    function validateOrThrowError(data: string[]) {
        data.forEach(response => {
            if (response.toLowerCase().startsWith('error')) {
                throw new Error(`Invalid command: ${data[0]}`);
            }
        });
    }
    function parseSendResponse(data: string[]) {
        // console.log(data);
        validateOrThrowError(data);
        return data.some(line => line.toLowerCase().startsWith('ok'));
    }
    async function runSendDataCommand(data: string, timeout: number) {
        return runner.executeCommand(`AT$SF=${data}`, {
            timeout,
            validation: parseSendResponse
        });
    }
    async function sendData(data: string, { timeout = commandTimeout } = {}) {
        await runner.runCommand(() => runSendDataCommand(data, timeout));
    }

    function parseSendResponseAndWait(data: string[]) {
        // console.log(data);
        validateOrThrowError(data);
        return data.some(line => line.toLowerCase().startsWith('+rx end'));
    }
    async function runSendDataCommandAndWait(data: string, timeout: number) {
        return runner.executeCommand(`AT$SF=${data},2,1`, {
            timeout,
            validation: parseSendResponseAndWait
        });
    }
    async function sendDataAndWaitForResponse(
        data: string,
        { timeout = commandTimeout } = {}
    ) {
        const response = await runner.runCommand(() =>
            runSendDataCommandAndWait(data, timeout)
        );
        // console.log(response.data);
        return response.data;
    }
    return {
        getVersion,
        getInformation,
        sendData,
        sendDataAndWaitForResponse
    };
}

export type SigfoxTD1208 = ReturnType<typeof buildTD1208>;
