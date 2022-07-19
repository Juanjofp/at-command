import { buildCommandRunnerMock, TD1208 } from '@/index';

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
        td1208 = TD1208.buildTD1208(serialPort, {
            commandTimeout: 100
        });
    });

    it('should get its version', async () => {
        commandRunnerMock.mockReadFromSerialPortOnce(
            commandRunnerMock.mockGenerateVersion('TD1208')
        );

        const version = await td1208.getVersion();

        expect(version).toBe('M10+2015');
    });

    it('should fails if serial port not responding getting version', async () => {
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

    it('should fails if serial port responding invalid data getting version', async () => {
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

    it('should fails if serial port responding error getting version', async () => {
        expect.assertions(1);
        commandRunnerMock.mockReadFromSerialPortOnce(
            commandRunnerMock.mockGenerateError('TD1208')
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

    it('should fails if serial port not responding getting info', async () => {
        expect.assertions(1);
        commandRunnerMock.mockCreateSerialPortThrowError(
            new Error('Cannot open fake port')
        );
        try {
            await td1208.getInformation();
        } catch (error) {
            expect(error).toEqual(new Error(`Cannot get information`));
        }
    });

    it('should fails if serial port responding invalid data', async () => {
        expect.assertions(1);
        commandRunnerMock.mockReadFromSerialPortOnce(['INVALID', 'STREAMS']);
        try {
            await td1208.getInformation();
        } catch (error) {
            expect(error).toEqual(new Error(`Cannot get information`));
        }
    });

    it('should fails if serial port responding valid data but not information included', async () => {
        expect.assertions(1);
        const info = commandRunnerMock.mockGenerateInfo('TD1208');
        const fakeInfo = info.filter((line, index) => index % 2 == 0);
        commandRunnerMock.mockReadFromSerialPortOnce(fakeInfo);

        try {
            await td1208.getInformation();
        } catch (error) {
            expect(error).toEqual(new Error(`Cannot get information`));
        }
    });

    it('should fails if serial port responding error getting information', async () => {
        expect.assertions(1);
        commandRunnerMock.mockReadFromSerialPortOnce(
            commandRunnerMock.mockGenerateError('TD1208')
        );
        try {
            await td1208.getInformation();
        } catch (error) {
            expect(error).toEqual(new Error(`Cannot get information`));
        }
    });

    const validFrames = [
        'ba',
        'aabbccddeeff',
        'AABBCCDDEEFF',
        '1a2b3c4d5e6fF6E5D4C3B2A1',
        '010203'
    ];
    it.each(validFrames)('should send the frame %s to backend', async frame => {
        commandRunnerMock.mockReadFromSerialPortOnce(
            commandRunnerMock.mockGenerateValidResponse('TD1208')
        );
        await td1208.sendData(frame, { timeout: 100 });
    });

    it('should fails if serial port responding error sending a frame', async () => {
        expect.assertions(1);
        const frame = '010203';
        commandRunnerMock.mockReadFromSerialPortOnce(
            commandRunnerMock.mockGenerateError('TD1208')
        );
        try {
            await td1208.sendData(frame, { timeout: 100 });
        } catch (error) {
            expect(error).toEqual(
                new Error(`Cannot send frame AT$SF=${frame}`)
            );
        }
    });

    it('should fails if serial port not respond', async () => {
        expect.assertions(1);
        const frame = '010203';
        try {
            await td1208.sendData(frame, { timeout: 100 });
        } catch (error) {
            expect(error).toEqual(
                new Error(`Cannot send frame AT$SF=${frame}`)
            );
        }
    });

    const invalidFrames = [
        {
            cause: 'Frame size exceed 12 bytes',
            frame: '11223344556677889910111213'
        },
        {
            cause: 'Invalid frame size (7 chars)',
            frame: '1122334'
        },
        {
            cause: 'Invalid empty frame',
            frame: ''
        },
        {
            cause: 'Invalid frame size (1 chars)',
            frame: 'a'
        },
        {
            cause: 'Frame must be hexadecimal',
            frame: '0A1b2G'
        },
        {
            cause: 'Frame must be hexadecimal',
            frame: 'Zz'
        }
    ];
    it.each(invalidFrames)(
        'should fail when send a invalid frame for $cause',
        async ({ cause, frame }) => {
            expect.assertions(1);
            commandRunnerMock.mockReadFromSerialPortOnce(
                commandRunnerMock.mockGenerateValidResponse('TD1208')
            );
            try {
                await td1208.sendData(frame);
            } catch (error) {
                expect(error).toEqual(
                    new Error(`Cannot send frame AT$SF=${frame}. ${cause}`)
                );
            }
        }
    );

    it('should send a frame to backend and wait for response from server', async () => {
        const data = 'ABCDEF010203';
        const dataReceived = 'aa bb cc dd ee ff 20 22 ';
        const expectedData = [0xaa, 0xbb, 0xcc, 0xdd, 0xee, 0xff, 0x20, 0x22];
        commandRunnerMock.mockReadFromSerialPortOnce(
            commandRunnerMock.mockGenerateDataReceived('TD1208', dataReceived)
        );

        const response = await td1208.sendDataAndWaitForResponse(data, {
            timeout: 500
        });

        expect(response).toEqual(expectedData);
    });

    it('should send a frame to backend and fail when send a invalid frame and wait for response', async () => {
        expect.assertions(1);
        commandRunnerMock.mockReadFromSerialPortOnce(
            commandRunnerMock.mockGenerateValidResponse('TD1208')
        );
        const data = 'FFCEDE0G';

        try {
            await td1208.sendData(data);
        } catch (error) {
            expect(error).toEqual(
                new Error(
                    `Cannot send frame AT$SF=${data}. Frame must be hexadecimal`
                )
            );
        }
    });

    it('should send a frame to backend and fails if serial port responding error sending a frame and wait response', async () => {
        expect.assertions(1);
        const frame = '010203';
        commandRunnerMock.mockReadFromSerialPortOnce(
            commandRunnerMock.mockGenerateError('TD1208')
        );
        try {
            await td1208.sendDataAndWaitForResponse(frame, { timeout: 100 });
        } catch (error) {
            expect(error).toEqual(
                new Error(`Cannot send frame AT$SF=${frame},2,1`)
            );
        }
    });

    it('should send a frame to backend and fails if serial port not respond when waiting a response', async () => {
        expect.assertions(1);
        const frame = '010203';
        try {
            await td1208.sendDataAndWaitForResponse(frame, { timeout: 100 });
        } catch (error) {
            expect(error).toEqual(
                new Error(`Cannot send frame AT$SF=${frame},2,1`)
            );
        }
    });

    it('should send a frame to backend and fails when server respond without data', async () => {
        expect.assertions(1);
        const data = '010203';
        commandRunnerMock.mockReadFromSerialPortOnce(
            commandRunnerMock.mockGenerateDataReceived('TD1208', '')
        );

        const response = await td1208.sendDataAndWaitForResponse(data, {
            timeout: 500
        });

        expect(response).toEqual([]);
    });

    it('should send a frame to backend and fails when server responds with NO data', async () => {
        const data = '010203';
        commandRunnerMock.mockReadFromSerialPortOnce(
            commandRunnerMock.mockGenerateNODataReceived('TD1208')
        );

        const response = await td1208.sendDataAndWaitForResponse(data, {
            timeout: 500
        });

        expect(response).toEqual([]);
    });
});
