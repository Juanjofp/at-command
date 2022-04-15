import { buildSerialPort } from '@/command-runner/build-serialport';
import { buildCommandRunner } from '@/command-runner/runner';
import { getSerialPortList } from '@/command-runner/list-serialport';

export const CommandRunnerBuilder = {
    buildSerialPort,
    buildCommandRunner,
    getSerialPortList
};
export type CommandRunnerBuilder = typeof CommandRunnerBuilder;
export * from '@/command-runner/models';
