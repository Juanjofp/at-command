import { buildNodeSerialport } from './build-node-serialport';
import { getSerialPortList } from './list-serialport';

export const ATSerialPortBuilder = {
  buildSerialPort: buildNodeSerialport,
  getSerialPortList
};
export type ATSerialPortBuilder = typeof ATSerialPortBuilder;
export * from './models';
