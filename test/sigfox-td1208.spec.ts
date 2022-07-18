import { buildCommandRunnerMock, defaultLogger, TD1208 } from '@/index';

const serialPath = '/dev/tty.usbmodem214301';
jest.setTimeout(50000);

describe('Sigfox TD1208', () => {
    const commandRunnerMock = buildCommandRunnerMock();
    let td1208: TD1208.SigfoxTD1208;
    beforeEach(async () => {
        commandRunnerMock.mockClear();
        const serialPort = await commandRunnerMock.buildSerialPort(serialPath, {
            baudRate: 9600
        });
        td1208 = TD1208.buildTD1208(serialPort, { logger: defaultLogger });
    });

    it('should get its version', async () => {
        commandRunnerMock.mockReadFromSerialPortOnce(
            commandRunnerMock.mockGenerateVersion('TD1208')
        );

        const version = await td1208.getVersion();

        expect(version).toBe('M10+2015');
    });

    it('should fails if serial port not responding', async () => {
        expect.assertions(1);
        commandRunnerMock.mockCreateSerialPortThrowError(
            new Error('Cannot open fake port')
        );
        try {
            await td1208.getVersion();
        } catch (error) {
            expect(error).toEqual(new Error(`Cannot get version`));
        }
    });

    it('should fails if serial port responding invalid data', async () => {
        expect.assertions(1);
        commandRunnerMock.mockReadFromSerialPortOnce(['INVALID', 'STREAMS']);
        try {
            await td1208.getVersion();
        } catch (error) {
            expect(error).toEqual(new Error(`Cannot get version`));
        }
    });

    it('should fails if serial port responding valid data but not version included', async () => {
        expect.assertions(1);
        commandRunnerMock.mockReadFromSerialPortOnce(
            commandRunnerMock.mockGenerateValidResponse('TD1208')
        );
        try {
            await td1208.getVersion();
        } catch (error) {
            expect(error).toEqual(new Error(`Cannot get version`));
        }
    });

    it('should get configuration info', async () => {
        commandRunnerMock.mockReadFromSerialPortOnce(
            commandRunnerMock.mockGenerateInfo('TD1208')
        );

        const info = await td1208.getInformation();

        expect(info.model).toEqual('Telecom Design TD1207');
        expect(info.hardwareVersion).toEqual('0F');
        expect(info.softwareVersion).toEqual('SOFT2068');
        expect(info.deviceId).toEqual('0020451D');
        expect(info.serialNumber).toEqual('140558105258');
        expect(info.region).toEqual('EU868');
    });

    it.skip('should send a frame to backend', async () => {
        await td1208.sendData('010203', { timeout: 5000 });
    });

    it.skip('should fail when send a invalid frame to backend', async () => {
        expect.assertions(1);
        try {
            await td1208.sendData('JUANJO');
        } catch (error) {
            expect(error).toEqual(new Error('Invalid command: AT$SF=JUANJO\r'));
        }
    });

    it.skip('should send a frame to backend and wait for response', async () => {
        const response = await td1208.sendDataAndWaitForResponse(
            '010203040506070809101112',
            {
                timeout: 60000
            }
        );

        expect(response).toEqual('aabbccddeeff2022');
    });
});

// Get Version
// [ 'ati5\r', 'M10+2015', 'OK' ]

// GetInformation
// [
//     'AT&V\r',
//     'Telecom Design TD1207',
//     'Hardware Version: 0F',
//     'Software Version: SOFT2068',
//     'S/N: 0020451D',
//     'TDID: 140558105258',
//     'ACTIVE PROFILE',
//     'E1 V1 Q0 X1 S200:0 S300:24 S301:2 S302:14 S303:1 S304:1 S305:0 S306:000001FF0000000000000000 S307:1 S308:1395000 S350:0 S351:32768 S352:1 S353:10 S400:000001 S401:FFFFFF S402:0 S403:869700000 S404:14 S405:-95 S406:1',
//     'OK'
// ]

// Send Error
//       [ 'AT$SF=JUANJO\r', 'ERROR' ]
//  [ 'AT$SF=000102030405060708090A0B0C0D0E0F,2,1\r', 'ERROR' ]
// Send OK
//[ 'AT$SF=010203\r', 'OK' ]
//       [ 'AT$SF=010203040506070809,2,1\r', 'OK', '+RX BEGIN', '+RX END' ]
// [
//     'AT$SF=010203040506070809101112,2,1\r',
//     'OK',
//     '+RX BEGIN',
//     '+RX=aa bb cc dd ee ff 20 22 ',
//     '+RX END'
// ]
// [
//     'AT$SF=010203040506070809101112,2,1\r',
//     'OK',
//     '+RX BEGIN',
//     '+RX END'
// ]
