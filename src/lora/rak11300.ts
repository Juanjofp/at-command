import {
    CommandRunnerBuilder,
    ATSerialPort,
    CommandResult,
    debugLogger
} from '../';
import { LoraDeps, LoraModels } from './models';
import { validateCommand } from './validators';
import { runWithRetryDelayed } from '../utils';
import { silentLogger } from '../log-service';

function validateRak11300Command(data: string[]) {
    return validateCommand(data, '+cme error', LoraModels.RAK11300);
}
function trimValueRak11300(data: string[], row: number, column: number) {
    const chunk = data[row];
    return chunk.trim().split(' ')[column].trim();
}
function parseInformation({ data }: CommandResult) {
    const statusStringChunks = data[0].split('\n');

    const region = trimValueRak11300(statusStringChunks, 23, 1);
    const joinMode = trimValueRak11300(statusStringChunks, 11, 0);
    const devEui = trimValueRak11300(statusStringChunks, 5, 2);
    const appEui = trimValueRak11300(statusStringChunks, 6, 2);
    const appKey = trimValueRak11300(statusStringChunks, 7, 2);
    const devAddress = trimValueRak11300(statusStringChunks, 8, 2);
    const nwksKey = trimValueRak11300(statusStringChunks, 9, 2);
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
        nwksKey,
        appsKey,
        isDutyCycle
    };
}

export function buildRak11300(
    serialPort: ATSerialPort,
    {
        debug = false,
        logger = debug ? debugLogger : silentLogger,
        runner = CommandRunnerBuilder.buildCommandRunner({
            serialPort,
            debug,
            logger
        }),
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
        return parseInformation(response);
    }

    function runSetDeviceEui(devEui: string) {
        return () =>
            runner.executeCommand(`AT+DEVEUI=${devEui}`, {
                timeout: commandTimeout,
                validation: validateRak11300Command
            });
    }
    async function setDeviceEui(devEui: string) {
        await runner.runCommand(runSetDeviceEui(devEui));
    }

    function runSetAppEui(appEui: string) {
        return () =>
            runner.executeCommand(`AT+APPEUI=${appEui}`, {
                timeout: commandTimeout,
                validation: validateRak11300Command
            });
    }
    async function setAppEui(appEui: string) {
        await runner.runCommand(runSetAppEui(appEui));
    }

    function runSetAppKey(appKey: string) {
        return () =>
            runner.executeCommand(`AT+APPKEY=${appKey}`, {
                timeout: commandTimeout,
                validation: validateRak11300Command
            });
    }
    async function setAppKey(appKey: string) {
        await runner.runCommand(runSetAppKey(appKey));
    }

    function runSetAppsKey(appsKey: string) {
        return () =>
            runner.executeCommand(`AT+APPSKEY=${appsKey}`, {
                timeout: commandTimeout,
                validation: validateRak11300Command
            });
    }
    async function setAppsKey(appsKey: string) {
        await runner.runCommand(runSetAppsKey(appsKey));
    }

    function runSetNwksKey(nwksKey: string) {
        return () =>
            runner.executeCommand(`AT+NWKSKEY=${nwksKey}`, {
                timeout: commandTimeout,
                validation: validateRak11300Command
            });
    }
    async function setNwksKey(nwksKey: string) {
        await runner.runCommand(runSetNwksKey(nwksKey));
    }

    function runSetDevAddress(devAddress: string) {
        return () =>
            runner.executeCommand(`AT+DEVADDR=${devAddress}`, {
                timeout: commandTimeout,
                validation: validateRak11300Command
            });
    }
    async function setDevAddress(devAddress: string) {
        await runner.runCommand(runSetDevAddress(devAddress));
    }

    function runSetConfirmation(confirmation: boolean) {
        return () =>
            runner.executeCommand(`AT+CFM=${confirmation ? 1 : 0}`, {
                timeout: commandTimeout,
                validation: validateRak11300Command
            });
    }
    async function setNeedsConfirmation(confirmation: boolean) {
        await runner.runCommand(runSetConfirmation(confirmation));
    }

    function runReset() {
        return () =>
            runner.executeCommand(`ATZ`, {
                timeout: 100
            });
    }
    async function reset() {
        try {
            await runner.runCommand(runReset());
        } catch (error) {
            // ignore
        }
        await runWithRetryDelayed(getVersion, 4, 1000);
    }

    function runIsJoined() {
        return () =>
            runner.executeCommand(`AT+NJS=?`, {
                timeout: commandTimeout,
                validation: validateRak11300Command
            });
    }
    function parseIsJoined(response: CommandResult) {
        return response.data[1].split(':')[1] === '1';
    }
    async function isJoined() {
        return parseIsJoined(await runner.runCommand(runIsJoined()));
    }

    function runJoinOrLeave(join: boolean, joinWhenTurnOn: boolean) {
        return () =>
            runner.executeCommand(
                `AT+JOIN=${join ? 1 : 0}:${joinWhenTurnOn ? 1 : 0}:8:10`,
                {
                    timeout: commandTimeout,
                    validation: validateRak11300Command
                }
            );
    }
    function runSetAutoJoin(joinWhenTurnOn: boolean) {
        return async () => {
            const infoResult = await runInformationCommand();
            const info = parseInformation(infoResult);

            return runJoinOrLeave(info.isJoined, joinWhenTurnOn)();
        };
    }
    async function setAutoJoin(joinWhenTurnOn = true) {
        await runner.runCommand(runSetAutoJoin(joinWhenTurnOn));
    }

    function runJoin() {
        return async () => {
            const infoResult = await runInformationCommand();
            const info = parseInformation(infoResult);
            if (info.isJoined) {
                return runIsJoined()();
            }
            return await runJoinOrLeave(true, info.isAutoJoined)();
        };
    }
    async function join() {
        await runner.runCommand(runJoin());
        const joined = await isJoined();
        if (joined) return true;
        await reset();
        await runWithRetryDelayed(isJoined, 4, 1000);
    }

    function runLeave() {
        return async () => {
            const infoResult = await runInformationCommand();
            const info = parseInformation(infoResult);
            if (!info.isJoined) {
                return runIsJoined()();
            }
            await runJoinOrLeave(false, info.isAutoJoined)();
            return runReset()();
        };
    }
    async function leave() {
        await runner.runCommand(runLeave());
        !(await runWithRetryDelayed(isJoined, 4, 1000));
    }

    return {
        getVersion,
        getInformation,
        setDeviceEui,
        setAppEui,
        setAppKey,
        setAppsKey,
        setNwksKey,
        setDevAddress,
        setNeedsConfirmation,
        setAutoJoin,
        reset,
        isJoined,
        join,
        leave
    };
}

export type LoraRak11300 = ReturnType<typeof buildRak11300>;
