import { ATSerialPort, CommandRunnerBuilder } from '@/command-runner';
import { LoraDeps } from './models';

export function buildRak11300(
    serialPort: ATSerialPort,
    {
        runner = CommandRunnerBuilder.buildCommandRunner(serialPort),
        commandTimeout = 3000
    }: LoraDeps = {}
) {
    async function getVersion() {
        const command = () =>
            runner?.executeCommand('ATI', { timeout: commandTimeout });
        const version = await runner.runCommand(command);
        console.log(version);
        return version;
    }
    return {
        getVersion
    };
}

export type LoraRak11300 = ReturnType<typeof buildRak11300>;
