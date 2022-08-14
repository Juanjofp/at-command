import { ATSerialPortBuilder, buildCommandRunnerMock, ERIC } from '@/index';

const serialPath = '/dev/tty.usbserial-FT3WBW7L';
jest.setTimeout(60000);

describe.skip('Sigfox ERIC should', () => {
    let eric: ERIC.ERIC;
    beforeAll(async () => {
        const serialPort = await ATSerialPortBuilder.buildSerialPort(
            serialPath,
            {
                baudRate: 9600
            }
        );
        eric = ERIC.buildEric(serialPort, { debug: false });
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

    it.skip('send the frame 1a2b3c4d5e6fF6E5D4C3B2A1 to backend', async () => {
        const frame = '1a2b3c4d5e6fF6E5D4C3B2A1';
        await eric.sendData(frame);
    });

    it.skip('send the frame ABCDEF010206 to backend and wait for response from server', async () => {
        const data = 'ABCDEF010206';
        const expectedData = [0xaa, 0xbb, 0xcc, 0xdd, 0xee, 0xff, 0x20, 0x22];

        const response = await eric.sendDataAndWaitForResponse(data, {
            timeout: 55000
        });

        expect(response).toEqual(expectedData);
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
            debug: false,
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
                    `Cannot get version: RunCommandError: Timeout error: 0 lines received for command: AT$I=5`
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

    const validFrames = [
        'ba',
        'aabbccddeeff',
        'AABBCCDDEEFF',
        '1a2b3c4d5e6fF6E5D4C3B2A1',
        '010203'
    ];
    it.each(validFrames)('send the frame %s to backend', async frame => {
        commandRunnerMock.mockReadFromSerialPortOnce(
            commandRunnerMock.mockGenerateValidResponse('ERIC')
        );

        await eric.sendData(frame, { timeout: 50 });
    });

    it('fails if serial port responding error sending a frame', async () => {
        expect.assertions(1);
        const frame = '010203';
        commandRunnerMock.mockReadFromSerialPortOnce(
            commandRunnerMock.mockGenerateError('TD1208')
        );
        try {
            await eric.sendData(frame, { timeout: 50 });
        } catch (error) {
            expect(error).toEqual(
                new Error(`Cannot send frame AT$SF=${frame},0`)
            );
        }
    });

    it('fails if serial port not respond', async () => {
        expect.assertions(1);
        const frame = '010203';
        try {
            await eric.sendData(frame, { timeout: 50 });
        } catch (error) {
            expect(error).toEqual(
                new Error(`Cannot send frame AT$SF=${frame},0`)
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
                await eric.sendData(frame, { timeout: 50 });
            } catch (error) {
                expect(error).toEqual(
                    new Error(`Cannot send frame AT$SF=${frame}. ${cause}`)
                );
            }
        }
    );

    it('send the frame ABCDEF010204 to backend and wait for response from server', async () => {
        const data = 'ABCDEF010204';
        const dataReceived = 'aa bb cc dd ee ff 20 22 ';
        const expectedData = [0xaa, 0xbb, 0xcc, 0xdd, 0xee, 0xff, 0x20, 0x22];
        commandRunnerMock.mockReadFromSerialPortOnce(
            commandRunnerMock.mockGenerateDataReceived('ERIC', dataReceived)
        );

        const response = await eric.sendDataAndWaitForResponse(data, {
            timeout: 50
        });

        expect(response).toEqual(expectedData);
    });

    it('send a frame to backend and fail when send a invalid frame and wait for response', async () => {
        expect.assertions(1);
        commandRunnerMock.mockReadFromSerialPortOnce(
            commandRunnerMock.mockGenerateValidResponse('ERIC')
        );
        const data = 'FFCEDE0G';

        try {
            await eric.sendData(data);
        } catch (error) {
            expect(error).toEqual(
                new Error(
                    `Cannot send frame AT$SF=${data}. Frame must be hexadecimal`
                )
            );
        }
    });

    it('send a frame to backend and fails if serial port responding error sending a frame and wait response', async () => {
        expect.assertions(1);
        const frame = '010203';
        commandRunnerMock.mockReadFromSerialPortOnce(
            commandRunnerMock.mockGenerateError(
                'ERIC',
                'ERR_SFX_ERR_SEND_FRAME_WAIT_TIMEOUT'
            )
        );
        try {
            await eric.sendDataAndWaitForResponse(frame, { timeout: 50 });
        } catch (error) {
            expect(error).toEqual(
                new Error(`Cannot send frame AT$SF=${frame},1`)
            );
        }
    });

    it('send a frame to backend and fails if serial port not respond when waiting a response', async () => {
        expect.assertions(1);
        const frame = '010203';
        try {
            await eric.sendDataAndWaitForResponse(frame, { timeout: 50 });
        } catch (error) {
            expect(error).toEqual(
                new Error(`Cannot send frame AT$SF=${frame},1`)
            );
        }
    });

    it('send a frame to backend and fails when server respond without data', async () => {
        expect.assertions(1);
        const data = '010203';
        commandRunnerMock.mockReadFromSerialPortOnce(
            commandRunnerMock.mockGenerateDataReceived('ERIC', '')
        );

        const response = await eric.sendDataAndWaitForResponse(data, {
            timeout: 50
        });

        expect(response).toEqual([]);
    });

    it('send a frame to backend and fails when server responds with NO data', async () => {
        const data = '010203';
        commandRunnerMock.mockReadFromSerialPortOnce(
            commandRunnerMock.mockGenerateNODataReceived('ERIC')
        );

        const response = await eric.sendDataAndWaitForResponse(data, {
            timeout: 50
        });

        expect(response).toEqual([]);
    });
});
