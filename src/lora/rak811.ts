import {
    ATSerialPort,
    CommandRunnerBuilder,
    CommandRunner
} from '@/command-runner';

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
            console.log(response.data);
            return parseInformation(response.data);
        } finally {
            await runner.close();
        }
    }
    return {
        getVersion,
        getInformation
    };
}

export type SigfoxRak811 = ReturnType<typeof buildRak811>;
