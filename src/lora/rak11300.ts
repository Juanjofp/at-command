import type { ATSerialPort } from '@/serialports';
import { CommandRunnerBuilder } from '@/command-runner';
import { LoraDeps } from './models';
import { validateCommand } from './validators';

function validateRak11300Command(data: string[]) {
    return validateCommand(data, '+cme error');
}

function parseInformation(data: string[]) {
    const region = data[1];
    return { region };
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
            runner?.executeCommand('AT+VER=?', {
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
