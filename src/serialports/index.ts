import { buildNodeSerialport } from '@/serialports/build-node-serialport';
import { getSerialPortList } from '@/serialports/list-serialport';

export const ATSerialPortBuilder = {
    buildSerialPort: buildNodeSerialport,
    getSerialPortList
};
export type ATSerialPortBuilder = typeof ATSerialPortBuilder;
export * from './models';
