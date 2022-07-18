import { Transform } from 'stream';
import {
    ATSerialPort,
    SerialPortInfo,
    WriteValues,
    CommandRunnerBuilder,
    ATSerialPortBuilder
} from '../';
import {
    errorResponseRAK811,
    infoDataRAK811,
    infoDataTD1208,
    receivedDataRAK811,
    validJOINRAK811,
    validResponseRAK811,
    versionRAK811,
    versionTD1208
} from './data';

export type DeviceModel = 'RAK811' | 'RAK11300' | 'TD1208';
type ErrorInDevice<T extends DeviceModel> = T extends 'RAK811'
    ? number
    : string;

export type CommandRunnerBuilderMock = {
    mockClear(): void;
    mockGetSerialPortList(list: SerialPortInfo[]): void;
    mockCreateSerialPortThrowError(error: Error): void;
    mockReadFromSerialPort(data: string[]): void;
    mockReadFromSerialPortOnce(data: string[]): void;
    mockGenerateInfo(device: DeviceModel): string[];
    mockGenerateVersion(device: DeviceModel): string[];
    mockGenerateValidResponse(device: DeviceModel): string[];
    mockGenerateError<T extends DeviceModel>(
        device: T,
        error: ErrorInDevice<T>
    ): string[];
    mockGenerateJoinSuccess(device: DeviceModel): string[];
    mockGenerateDataReceived(device: DeviceModel, data: string): string[];
} & CommandRunnerBuilder &
    ATSerialPortBuilder;

export function buildCommandRunnerMock(): CommandRunnerBuilderMock {
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

    function mockGenerateInfo(device: DeviceModel) {
        if (device === 'RAK811') return infoDataRAK811;
        if (device === 'TD1208') return infoDataTD1208;
        return ['', ''];
    }

    function mockGenerateVersion(device: DeviceModel) {
        if (device === 'RAK811') return versionRAK811;
        if (device === 'TD1208') return versionTD1208;
        return ['', ''];
    }

    function mockGenerateValidResponse(device: DeviceModel) {
        if (device === 'RAK811') return validResponseRAK811;
        if (device === 'TD1208') return validResponseRAK811;
        return ['', ''];
    }

    function mockGenerateError<T extends DeviceModel>(
        device: T,
        error: ErrorInDevice<T>
    ) {
        if (device === 'RAK811') {
            return errorResponseRAK811(+error);
        }
        return ['', ''];
    }

    function mockGenerateJoinSuccess(device: DeviceModel) {
        if (device === 'RAK811') return validJOINRAK811;
        return ['', ''];
    }

    function mockGenerateDataReceived(device: DeviceModel, data: string) {
        if (device === 'RAK811') return receivedDataRAK811(data);
        return ['', ''];
    }

    return {
        mockClear,
        mockGetSerialPortList,
        mockCreateSerialPortThrowError,
        mockReadFromSerialPort,
        mockReadFromSerialPortOnce,
        mockGenerateInfo,
        mockGenerateVersion,
        mockGenerateValidResponse,
        mockGenerateError,
        mockGenerateJoinSuccess,
        mockGenerateDataReceived,
        getSerialPortList: () => Promise.resolve(serialPortList),
        buildSerialPort,
        buildCommandRunner: CommandRunnerBuilder.buildCommandRunner
    };
}
