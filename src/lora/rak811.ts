import {
    ATSerialPort,
    CommandRunnerBuilder,
    CommandRunner
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
        const isConfirmValue = trimValue(data[10]);
        const isConfirm = isConfirmValue === 'unconfirm';
        const isJoinedValue = trimValue(data[10]);
        const isJoined = isJoinedValue === 'true';

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

    function validateCommand(data: string[]) {
        if (data.length > 0) {
            const response = data[data.length - 1];
            if (response.toLowerCase().startsWith('ok')) {
                return true;
            }
            if (response.toLowerCase().startsWith('error')) {
                const errorCode = trimValue(response);
                throw new LoraResponseError(errorCode);
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

    async function runJoinCommand() {
        return runner.executeCommand('at+join', {
            timeout: 10000,
            validation: validateCommand
        });
    }
    async function join() {
        await runner.runCommand(runJoinCommand);
    }

    async function runSendData() {
        return await runner.executeCommand('at+send=lora:1:0102030405060708', {
            timeout: 10000
        });
    }
    async function sendData() {
        await runner.runCommand(async () => {
            const infoResponse = await runInformationCommand();
            console.log(infoResponse);
            const info = parseInformation(infoResponse.data);
            console.log(info);
            if (!info.isJoined) {
                await runJoinCommand();
            }
            // Check confirmation
            if (!info.isConfirm) {
                // await runSetConfirm(true);
                console.log('Confirmation is not enabled');
            }
            return await runSendData();
        });
    }

    return {
        getVersion,
        getInformation,
        setDeviceEui,
        setAppEui,
        setAppKey,
        join,
        sendData
    };
}

export type SigfoxRak811 = ReturnType<typeof buildRak811>;
