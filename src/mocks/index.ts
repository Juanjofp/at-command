import { Transform } from 'stream';
import {
  ATSerialPort,
  SerialPortInfo,
  WriteValues,
  CommandRunnerBuilder,
  ATSerialPortBuilder
} from '../';
import {
  errorResponseERIC,
  errorResponseRAK11300,
  errorResponseRAK811,
  errorResponseTD1208,
  infoDataERIC,
  infoDataRAK11300,
  infoDataRAK811,
  infoDataTD1208,
  receivedDataERIC,
  receivedDataRAK811,
  receivedDataTD1208,
  receivedNODataERIC,
  receivedNODataRAK811,
  receivedNODataTD1208,
  validJOINRAK811,
  validResponseERIC,
  validResponseRAK11300,
  validResponseRAK811,
  validResponseTD1208,
  versionERIC,
  versionRAK11300,
  versionRAK811,
  versionTD1208
} from './data';

export type DeviceModel = 'RAK811' | 'RAK11300' | 'TD1208' | 'ERIC';

type ErrorInDevice<T extends DeviceModel> = T extends 'RAK811'
  ? number
  : T extends 'RAK11300'
  ? number
  : T extends 'TD1208'
  ? never
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
    error?: ErrorInDevice<T>
  ): string[];
  mockGenerateJoinSuccess(device: DeviceModel): string[];
  mockGenerateDataReceived(device: DeviceModel, data: string): string[];
  mockGenerateNODataReceived(device: DeviceModel): string[];
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

  let mockResponseOnce: string[][] = [];
  function mockReadFromSerialPortOnce(data: string[]) {
    mockResponseOnce.push(data);
  }
  function sendDataToSerialPort() {
    const mockResponseData = mockResponseOnce.shift() || mockResponse;
    mockResponseData.forEach((line, index) => {
      setTimeout(() => {
        mockTransform.write(line);
      }, 5 * index);
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
    mockResponseOnce = [];
  }

  function mockGenerateInfo(device: DeviceModel) {
    if (device === 'RAK811') return infoDataRAK811;
    if (device === 'TD1208') return infoDataTD1208;
    if (device === 'RAK11300') return infoDataRAK11300;
    if (device === 'ERIC') return infoDataERIC;
    return ['', ''];
  }

  function mockGenerateVersion(device: DeviceModel) {
    if (device === 'RAK811') return versionRAK811;
    if (device === 'TD1208') return versionTD1208;
    if (device === 'RAK11300') return versionRAK11300;
    if (device === 'ERIC') return versionERIC;
    return ['', ''];
  }

  function mockGenerateValidResponse(device: DeviceModel) {
    if (device === 'RAK811') return validResponseRAK811;
    if (device === 'TD1208') return validResponseTD1208;
    if (device === 'RAK11300') return validResponseRAK11300;
    if (device === 'ERIC') return validResponseERIC;
    return ['', ''];
  }

  function mockGenerateError<T extends DeviceModel>(
    device: T,
    error?: ErrorInDevice<T>
  ) {
    if (device === 'RAK811') {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return errorResponseRAK811(+error!);
    }
    if (device === 'RAK11300') {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return errorResponseRAK11300(+error!);
    }
    if (device === 'TD1208') return errorResponseTD1208;
    if (device === 'ERIC') return errorResponseERIC(error + '');
    return ['', ''];
  }

  function mockGenerateJoinSuccess(device: DeviceModel) {
    if (device === 'RAK811') return validJOINRAK811;
    if (device === 'RAK11300') return validResponseRAK11300;
    return ['', ''];
  }

  function mockGenerateDataReceived(device: DeviceModel, data: string) {
    if (device === 'RAK811') return receivedDataRAK811(data);
    if (device === 'TD1208') return receivedDataTD1208(data);
    if (device === 'ERIC') return receivedDataERIC(data);
    return ['', ''];
  }

  function mockGenerateNODataReceived(device: DeviceModel) {
    if (device === 'RAK811') return receivedNODataRAK811;
    if (device === 'TD1208') return receivedNODataTD1208;
    if (device === 'ERIC') return receivedNODataERIC;
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
    mockGenerateNODataReceived,
    getSerialPortList: () => Promise.resolve(serialPortList),
    buildSerialPort,
    buildCommandRunner: CommandRunnerBuilder.buildCommandRunner
  };
}
