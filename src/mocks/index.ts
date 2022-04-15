import {
    ATSerialPort,
    CommandRunnerBuilder,
    SerialPortInfo
} from '@/command-runner';
import { Transform } from 'stream';
import { CommandRunner } from '@/command-runner/runner';

export type CommandRunnerBuilderMock = {
    mockClear(): void;
    mockGetSerialPortList(list: SerialPortInfo[]): void;
    mockCreateSerialPortThrowError(error: Error): void;
} & CommandRunnerBuilder;

let serialPortList: SerialPortInfo[] = [];
function mockGetSerialPortList(list: SerialPortInfo[]) {
    serialPortList = list;
}

let errorWhenCreatePort: Error | undefined;
function mockCreateSerialPortThrowError(error: Error) {
    errorWhenCreatePort = error;
}
async function buildSerialPort(/*port: string*/) {
    if (errorWhenCreatePort) {
        throw errorWhenCreatePort;
    }
    return serialPortMock;
}

let isPortOpen = false;
async function open() {
    isPortOpen = true;
    return Promise.resolve(undefined);
}
async function close() {
    isPortOpen = false;
    return Promise.resolve(undefined);
}
const serialPortMock: ATSerialPort = {
    open,
    isOpen: () => isPortOpen,
    close,
    write: () => Promise.resolve(5),
    read(): Transform {
        return new Transform({
            transform(chunk, encoding, callback) {
                callback(undefined, chunk);
            }
        });
    }
};

function mockClear() {
    serialPortList = [];
    errorWhenCreatePort = undefined;
}

function buildCommandRunner() {
    return undefined as unknown as CommandRunner;
}

export const CommandRunnerBuilderMock: CommandRunnerBuilderMock = {
    mockClear,
    mockGetSerialPortList,
    mockCreateSerialPortThrowError,
    getSerialPortList: () => Promise.resolve(serialPortList),
    buildSerialPort,
    buildCommandRunner
};
