import type { ATSerialPort } from '@/serialports';
import { CommandRunnerBuilder } from '@/command-runner';
import { LoraDeps } from './models';
import { validateCommand } from './validators';

function validateRak11300Command(data: string[]) {
    return validateCommand(data, '+cme error');
}

function trimValueRak11300(data: string[], row: number, column: number) {
    const chunk = data[row];
    return chunk.trim().split(' ')[column].trim();
}
function parseInformation(data: string[]) {
    const statusStringChunks = data[0].split('\n');
    console.log(statusStringChunks[5].trim().split(' '));

    const region = trimValueRak11300(statusStringChunks, 23, 1);
    const joinMode = trimValueRak11300(statusStringChunks, 11, 0);
    const devEui = trimValueRak11300(statusStringChunks, 5, 2);
    const appEui = trimValueRak11300(statusStringChunks, 6, 2);
    const appKey = trimValueRak11300(statusStringChunks, 7, 2);
    const devAddress = trimValueRak11300(statusStringChunks, 8, 2);
    const nwsKey = trimValueRak11300(statusStringChunks, 9, 2);
    const appsKey = trimValueRak11300(statusStringChunks, 10, 2);

    const classTypeNumeric = trimValueRak11300(statusStringChunks, 19, 1);
    const classType = classTypeNumeric === '0' ? 'A' : 'B';

    const isConfirmString = trimValueRak11300(statusStringChunks, 22, 0);
    const isConfirm = isConfirmString === 'Confirmed';

    const isJoinedString = trimValueRak11300(statusStringChunks, 24, 1);
    const isJoined = isJoinedString !== 'not';

    const isAutoJoinedString = trimValueRak11300(statusStringChunks, 1, 2);
    const isAutoJoined = isAutoJoinedString === 'enabled';

    const isDutyCycleString = trimValueRak11300(statusStringChunks, 14, 1);
    const isDutyCycle = isDutyCycleString === 'enabled';

    return {
        region,
        joinMode,
        devEui,
        appEui,
        appKey,
        classType,
        isConfirm,
        isJoined,
        isAutoJoined,
        devAddress,
        nwsKey,
        appsKey,
        isDutyCycle
    };
}

export function buildRak11300(
    serialPort: ATSerialPort,
    {
        runner = CommandRunnerBuilder.buildCommandRunner(serialPort),
        commandTimeout = 3000
    }: LoraDeps = {}
) {
    async function getVersion() {
        const command = () =>
            runner.executeCommand('AT+VER=?', {
                timeout: commandTimeout,
                validation: validateRak11300Command
            });
        const response = await runner.runCommand(command);
        return response.data[1].split(' ')[0].split(':')[1];
    }

    async function runInformationCommand() {
        return runner.executeCommand('AT+STATUS=?', {
            timeout: commandTimeout,
            validation: validateRak11300Command
        });
    }
    async function getInformation() {
        const response = await runner.runCommand(runInformationCommand);
        return parseInformation(response.data);
    }

    return {
        getVersion,
        getInformation
    };
}

export type LoraRak11300 = ReturnType<typeof buildRak11300>;
