import {
    ATSerialPort,
    CommandRunnerBuilder,
    SerialPortInfo,
    WriteValues
} from '@/command-runner';
import { Transform } from 'stream';
import { buildCommandRunner } from '@/command-runner/runner';

export type CommandRunnerBuilderMock = {
    mockClear(): void;
    mockGetSerialPortList(list: SerialPortInfo[]): void;
    mockCreateSerialPortThrowError(error: Error): void;
    mockReadFromSerialPort(data: string): void;
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
const mockTransform = new Transform({
    transform(chunk, encoding, callback) {
        callback(undefined, chunk);
    }
});
let mockResponse = '';
function mockReadFromSerialPort(data: string) {
    mockResponse = data;
}
async function write(data: WriteValues) {
    setTimeout(() => {
        mockTransform.write(mockResponse);
    }, 100);
    return Promise.resolve(data.length);
}

const serialPortMock: ATSerialPort = {
    open,
    isOpen: () => isPortOpen,
    close,
    write,
    read: () => mockTransform
};

function mockClear() {
    serialPortList = [];
    errorWhenCreatePort = undefined;
    mockResponse = '';
}

export const CommandRunnerBuilderMock: CommandRunnerBuilderMock = {
    mockClear,
    mockGetSerialPortList,
    mockCreateSerialPortThrowError,
    mockReadFromSerialPort,
    getSerialPortList: () => Promise.resolve(serialPortList),
    buildSerialPort,
    buildCommandRunner
};
