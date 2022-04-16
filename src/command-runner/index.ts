import { buildSerialPort } from '@/command-runner/build-serialport';
import {
    buildCommandRunner,
    CommandRunner as CommandRunnerType
} from '@/command-runner/runner';
import { getSerialPortList } from '@/command-runner/list-serialport';

export const CommandRunnerBuilder = {
    buildSerialPort,
    buildCommandRunner,
    getSerialPortList
};
export type CommandRunnerBuilder = typeof CommandRunnerBuilder;
export type CommandRunner = CommandRunnerType;
export * from '@/command-runner/models';
