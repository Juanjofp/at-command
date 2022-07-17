import { Transform } from 'stream';
import {
    ATSerialPort,
    SerialPortInfo,
    WriteValues,
    CommandRunnerBuilder,
    ATSerialPortBuilder
} from '../';

export type CommandRunnerBuilderMock = {
    mockClear(): void;
    mockGetSerialPortList(list: SerialPortInfo[]): void;
    mockCreateSerialPortThrowError(error: Error): void;
    mockReadFromSerialPort(data: string[]): void;
    mockReadFromSerialPortOnce(data: string[]): void;
} & CommandRunnerBuilder &
    ATSerialPortBuilder;

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
let mockResponse: string[] = [];
function mockReadFromSerialPort(data: string[]) {
    mockResponse = data;
}

const mockResponseOnce: string[][] = [];
function mockReadFromSerialPortOnce(data: string[]) {
    mockResponseOnce.push(data);
}
function sendDataToSerialPort() {
    const mockResponseData = mockResponseOnce.shift() || mockResponse;
    mockResponseData.forEach((line, index) => {
        setTimeout(() => {
            mockTransform.write(line);
        }, 10 * index);
    });
}
async function write(data: WriteValues) {
    sendDataToSerialPort();
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
    mockResponse = [];
}

export const CommandRunnerBuilderMock: CommandRunnerBuilderMock = {
    mockClear,
    mockGetSerialPortList,
    mockCreateSerialPortThrowError,
    mockReadFromSerialPort,
    mockReadFromSerialPortOnce,
    getSerialPortList: () => Promise.resolve(serialPortList),
    buildSerialPort,
    buildCommandRunner: CommandRunnerBuilder.buildCommandRunner
};
