import { ATSerialPortBuilder, buildCommandRunnerMock, ERIC } from '@/index';

const serialPath = '/dev/tty.usbserial-FT3WBW7L';
jest.setTimeout(50000);

describe('Sigfox ERIC should', () => {
    let eric: ERIC.ERIC;
    beforeAll(async () => {
        const serialPort = await ATSerialPortBuilder.buildSerialPort(
            serialPath,
            {
                baudRate: 9600
            }
        );
        eric = ERIC.buildEric(serialPort, { debug: true });
    });

    it('get its version', async () => {
        const version = await eric.getVersion();

        expect(version).toEqual('1.1.0');
    });

    it('get its status information', async () => {
        const information = await eric.getInformation();

        expect(information).toEqual({
            model: 'AX-Sigfox',
            softwareVersion: '1.1.0-ETSI',
            hardwareVersion: 'unknown',
            deviceId: '00C16E3F',
            serialNumber: '5A5C706778434E31',
            region: 'EU868'
        });
    });

    const validFrames = [
        'ba',
        'aabbccddeeff',
        'AABBCCDDEEFF',
        '1a2b3c4d5e6fF6E5D4C3B2A1',
        '010203'
    ];
    it.skip.each(validFrames)('send the frame %s to backend', async frame => {
        await eric.sendData(frame, { timeout: 5000 });
    });
});

describe('Sigfox ERIC MOCK should', () => {
    let eric: ERIC.ERIC;
    const commandRunnerMock = buildCommandRunnerMock();
    beforeEach(async () => {
        commandRunnerMock.mockClear();
        const serialPort = await commandRunnerMock.buildSerialPort(serialPath, {
            baudRate: 9600
        });
        eric = ERIC.buildEric(serialPort, {
            debug: true,
            commandTimeout: 100
        });
    });

    it('get its version', async () => {
        commandRunnerMock.mockReadFromSerialPortOnce(
            commandRunnerMock.mockGenerateVersion('ERIC')
        );

        const version = await eric.getVersion();

        expect(version).toEqual('1.1.0');
    });

    it('fails if serial port responding invalid data getting version', async () => {
        expect.assertions(1);
        commandRunnerMock.mockReadFromSerialPortOnce(['INVALID', 'STREAMS']);
        try {
            await eric.getVersion();
        } catch (error) {
            expect(error).toEqual(
                new Error(
                    `Cannot get version: RunCommandError: Timeout error: 0 lines received for command: AT$I=8`
                )
            );
        }
    });

    it('fails if serial port responding valid data but not version included', async () => {
        expect.assertions(1);
        commandRunnerMock.mockReadFromSerialPortOnce(
            commandRunnerMock.mockGenerateValidResponse('ERIC')
        );
        try {
            await eric.getVersion();
        } catch (error) {
            expect(error).toEqual(
                new Error(
                    `Cannot get version: RunCommandError: Timeout error: 0 lines received for command: AT$I=4`
                )
            );
        }
    });

    it('fails if serial port responding error getting invalid command', async () => {
        expect.assertions(1);
        commandRunnerMock.mockReadFromSerialPortOnce(
            commandRunnerMock.mockGenerateError('ERIC', 'ATCMD_NOT_SUPPORTED')
        );
        try {
            await eric.getVersion();
        } catch (error) {
            expect(error).toEqual(
                new Error(
                    `Cannot get version: Error: Invalid command response: ATCMD_NOT_SUPPORTED`
                )
            );
        }
    });

    it('fails if serial port responding error getting invalid version', async () => {
        expect.assertions(1);
        commandRunnerMock.mockReadFromSerialPortOnce(
            commandRunnerMock.mockGenerateError('ERIC', 'ERROR: parse error')
        );
        try {
            await eric.getVersion();
        } catch (error) {
            expect(error).toEqual(
                new Error(
                    `Cannot get version: Error: Invalid command response: ERROR: parse error`
                )
            );
        }
    });

    it('get configuration info', async () => {
        commandRunnerMock.mockReadFromSerialPortOnce(
            commandRunnerMock.mockGenerateInfo('ERIC')
        );

        const information = await eric.getInformation();

        expect(information).toEqual({
            model: 'AX-Sigfox',
            softwareVersion: '1.1.0-ETSI',
            hardwareVersion: 'unknown',
            deviceId: '00C16E3F',
            serialNumber: '5A5C706778434E31',
            region: 'EU868'
        });
    });

    it('fails if serial port not responding getting info', async () => {
        expect.assertions(1);
        commandRunnerMock.mockCreateSerialPortThrowError(
            new Error('Cannot open fake port')
        );
        try {
            await eric.getInformation();
        } catch (error) {
            expect(error).toEqual(
                new Error(
                    `Cannot get information: RunCommandError: Timeout error: 0 lines received for command: AT$I=0`
                )
            );
        }
    });

    it('fails if serial port responding invalid data', async () => {
        expect.assertions(1);
        commandRunnerMock.mockReadFromSerialPortOnce(['INVALID', 'STREAMS']);
        try {
            await eric.getInformation();
        } catch (error) {
            expect(error).toEqual(
                new Error(
                    `Cannot get information: RunCommandError: Timeout error: 0 lines received for command: AT$I=11`
                )
            );
        }
    });

    it('fails if serial port responding valid data but not information included', async () => {
        expect.assertions(1);
        const info = commandRunnerMock.mockGenerateInfo('ERIC');
        const fakeInfo = info.filter((line, index) => index % 2 == 0);
        commandRunnerMock.mockReadFromSerialPortOnce(fakeInfo);

        try {
            await eric.getInformation();
        } catch (error) {
            expect(error).toEqual(
                new Error(
                    `Cannot get information: RunCommandError: Timeout error: 0 lines received for command: AT$I=11`
                )
            );
        }
    });

    it('fails if serial port responding error getting information', async () => {
        expect.assertions(1);
        commandRunnerMock.mockReadFromSerialPortOnce(
            commandRunnerMock.mockGenerateError('ERIC', 'ERROR: parse error')
        );
        try {
            await eric.getInformation();
        } catch (error) {
            expect(error).toEqual(
                new Error(
                    `Cannot get information: Error: Invalid command response: ERROR: parse error`
                )
            );
        }
    });
});

// Error sending data
// ERR_SFX_ERR_SEND_FRAME_WAIT_TIMEOUT
// ERROR: parse error
// ATCMD_NOT_SUPPORTED

// Received Data
// console.log
// <Info> Executing Command AT$SF=aabbcc,1
//
// at Object.info (src/log-service/index.ts:3:17)
//
// console.log
// <Info> [SerialPort] Received line OK
//
// at Object.info (src/log-service/index.ts:3:17)
//
// console.log
// received data [ 'OK' ]
//
// at validation (src/sigfox/eric.ts:27:29)
//
// console.log
// <Info> [SerialPort] Received line RX=00 0D 08 14 16 0B 26 2C
//
// at Object.info (src/log-service/index.ts:3:17)
//
// console.log
// received data [ 'OK', 'RX=00 0D 08 14 16 0B 26 2C' ]
