import {
    ATSerialPort,
    CommandRunnerBuilder,
    CommandRunner,
    CommandResult
} from '@/command-runner';
import { LoraResponseError } from '@/lora/models';

export type LoraDeps = {
    runner?: CommandRunner;
    commandTimeout?: number;
};
export function buildRak811(
    serialPort: ATSerialPort,
    {
        runner = CommandRunnerBuilder.buildCommandRunner(serialPort),
        commandTimeout = 3000
    }: LoraDeps = {}
) {
    async function getVersion() {
        const command = () =>
            runner.executeCommand('at+version', {
                timeout: commandTimeout
            });
        const response = await runner.runCommand(command);
        return response.data[0].split(' ')[1];
    }

    function trimValue(line: string) {
        return line.split(':')[1].trim() || 'unknown';
    }
    function parseInformation(data: string[]) {
        const region = trimValue(data[1]);
        const joinMode = trimValue(data[5]);
        const devEui = trimValue(data[6]);
        const appEui = trimValue(data[7]);
        const appKey = trimValue(data[8]);
        const classType = trimValue(data[9]);
        const isJoinedValue = trimValue(data[10]);
        const isJoined = isJoinedValue === 'true';
        const isConfirmValue = trimValue(data[11]);
        const isConfirm = isConfirmValue !== 'unconfirm';
        return {
            region,
            joinMode,
            devEui,
            appEui,
            appKey,
            classType,
            isJoined,
            isConfirm
        };
    }
    async function runInformationCommand() {
        return runner.executeCommand('at+get_config=lora:status', {
            validation: data => data.length === 25,
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
                const errorCode = trimValue(response);
                throw new LoraResponseError(errorCode);
            }
        });
    }
    function validateCommand(data: string[]) {
        if (data.length > 0) {
            validateOrThrowError(data);
            for (const response of data) {
                if (response.toLowerCase().startsWith('ok')) {
                    return true;
                }
            }
        }
        return false;
    }

    async function runSetDeviceEui(devEui: string) {
        return runner.executeCommand(`at+set_config=lora:dev_eui:${devEui}`, {
            timeout: commandTimeout,
            validation: validateCommand
        });
    }
    async function setDeviceEui(devEui: string) {
        await runner.runCommand(() => runSetDeviceEui(devEui));
    }

    async function runSetAppEui(appEui: string) {
        return runner.executeCommand(`at+set_config=lora:app_eui:${appEui}`, {
            timeout: commandTimeout,
            validation: validateCommand
        });
    }
    async function setAppEui(appEui: string) {
        await runner.runCommand(() => runSetAppEui(appEui));
    }

    async function runSetAppKey(appKey: string) {
        return runner.executeCommand(`at+set_config=lora:app_key:${appKey}`, {
            timeout: commandTimeout,
            validation: validateCommand
        });
    }
    async function setAppKey(appKey: string) {
        await runner.runCommand(() => runSetAppKey(appKey));
    }

    async function runJoinCommand(timeout: number): Promise<CommandResult> {
        const infoResponse = await runInformationCommand();
        const info = parseInformation(infoResponse.data);
        if (info.isJoined) {
            return {
                data: ['Ok Join Success'],
                command: 'at+join'
            };
        }
        return runner.executeCommand('at+join', {
            timeout,
            validation: validateCommand
        });
    }
    async function join({ timeout = 10000 } = {}) {
        await runner.runCommand(() => runJoinCommand(timeout));
    }

    async function runConfirmCommand(confirmation: boolean) {
        return runner.executeCommand(
            `at+set_config=lora:confirm:${confirmation ? 1 : 0}`,
            {
                validation: validateCommand
            }
        );
    }
    async function needsConfirmation(confirmation: boolean) {
        await runner.runCommand(() => runConfirmCommand(confirmation));
    }

    async function runSendData(
        data: string,
        validation: (data: string[]) => boolean,
        timeout: number
    ) {
        return await runner.executeCommand(`at+send=lora:2:${data}`, {
            timeout,
            validation
        });
    }

    async function sendData(
        data: string,
        {
            confirmed = false,
            timeout,
            validation = validateCommand
        }: {
            confirmed?: boolean;
            validation?: (data: string[]) => boolean;
            timeout: number;
        }
    ) {
        return await runner.runCommand(async () => {
            const infoResponse = await runInformationCommand();
            const info = parseInformation(infoResponse.data);
            if (!info.isJoined) {
                await runJoinCommand(10000);
            }
            if (info.isConfirm !== confirmed) {
                await runConfirmCommand(confirmed);
            }
            return await runSendData(data, validation, timeout);
        });
    }

    async function sendUnconfirmedData(data: string, { timeout = 10000 } = {}) {
        await sendData(data, { timeout });
    }

    function waitForReceivedValidation(data: string[]) {
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
    function parseDataReceived(data: string) {
        const [, message] = data.split('=');
        const [status, response] = message.split(':');
        const [port, rssi, snr, dataSize] = status.split(',');
        return {
            status: parseInt(status),
            port: parseInt(port),
            rssi: parseInt(rssi),
            snr: parseInt(snr),
            dataSize: parseInt(dataSize),
            data: response
        };
    }
    async function sendDataAndWaitResponse(
        data: string,
        { timeout, confirmed = false }: { timeout: number; confirmed?: boolean }
    ) {
        const response = await sendData(data, {
            confirmed,
            timeout,
            validation: waitForReceivedValidation
        });
        return parseDataReceived(response.data[1]);
    }

    async function sendConfirmedData(data: string, { timeout = 6000 } = {}) {
        return sendDataAndWaitResponse(data, {
            timeout,
            confirmed: true
        });
    }

    async function sendUnconfirmedDataAndWaitForResponse(
        data: string,
        { timeout = 6000 } = {}
    ) {
        return sendDataAndWaitResponse(data, { timeout });
    }

    async function sendConfirmedDataAndWaitForResponse(
        data: string,
        { timeout = 10000 } = {}
    ) {
        return sendDataAndWaitResponse(data, {
            timeout,
            confirmed: true
        });
    }

    return {
        getVersion,
        getInformation,
        setDeviceEui,
        setAppEui,
        setAppKey,
        join,
        needsConfirmation,
        sendUnconfirmedData,
        sendConfirmedData,
        sendUnconfirmedDataAndWaitForResponse,
        sendConfirmedDataAndWaitForResponse
    };
}

export type LoraRak811 = ReturnType<typeof buildRak811>;
