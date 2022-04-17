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
        try {
            await runner.open();
            const response = await runner.runCommand('at+version', {
                timeout: commandTimeout
            });
            return response.data[0].split(' ')[1];
        } finally {
            await runner.close();
        }
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

        return {
            region,
            joinMode,
            devEui,
            appEui,
            appKey,
            classType,
            isJoined
        };
    }
    async function getInformation() {
        try {
            await runner.open();
            const response = await runner.runCommand(
                'at+get_config=lora:status',
                {
                    validation: data => data.length === 25,
                    timeout: commandTimeout
                }
            );
            return parseInformation(response.data);
        } finally {
            await runner.close();
        }
    }

    function validateSetCommand(data: string[]) {
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

    async function setDeviceEui(devEui: string) {
        try {
            await runner.open();
            await runner.runCommand(`at+set_config=lora:dev_eui:${devEui}`, {
                timeout: commandTimeout,
                validation: validateSetCommand
            });
        } finally {
            await runner.close();
        }
    }

    async function setAppEui(appEui: string) {
        try {
            await runner.open();
            await runner.runCommand(`at+set_config=lora:app_eui:${appEui}`, {
                timeout: commandTimeout,
                validation: validateSetCommand
            });
        } finally {
            await runner.close();
        }
    }
    return {
        getVersion,
        getInformation,
        setDeviceEui,
        setAppEui
    };
}

export type SigfoxRak811 = ReturnType<typeof buildRak811>;
