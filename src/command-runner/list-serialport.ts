import { SerialPort } from 'serialport';
import { SerialPortInfo } from '@/command-runner/models';

export async function getSerialPortList(): Promise<SerialPortInfo[]> {
    const ports = await SerialPort.list();
    return ports.map(port => ({
        path: port.path,
        vendorId: port.vendorId,
        manufacturer: port.manufacturer,
        productId: port.productId,
        serialNumber: port.serialNumber || '00-00-00-00-00-00-00-00'
    }));
}
