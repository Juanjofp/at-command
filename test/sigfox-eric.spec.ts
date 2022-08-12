import { ATSerialPortBuilder, ERIC } from '@/index';

const serialPath = '/dev/tty';
jest.setTimeout(50000);

describe('Sigfox ERIC should', () => {
    it('get its version', async () => {
        const atPort = await ATSerialPortBuilder.buildSerialPort(serialPath, {baudRate: 9600});
        const eric = Eric.buildEric(atPort, {debug: true});
    });
});
