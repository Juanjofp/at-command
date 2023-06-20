import { ATSerialPortBuilder, SIM800C } from '@/index';

const serialPath = '/dev/tty.usbserial-1240';
// const serialPath = '/dev/tty.usbmodem12207';

jest.setTimeout(60000);

describe.skip('GSM SIM800C should', () => {
  // ~~~~~~

  it('should get its version', async () => {
    const serialPort = await ATSerialPortBuilder.buildSerialPort(serialPath, {
      baudRate: 115200
    });

    const sim800c = SIM800C.buildSIM800C(serialPort, {
      debug: true,
      commandTimeout: 30000
    });

    const version = await sim800c.getVersion();

    console.log('Version', version);

    expect(version).toBe('');
  });
});
