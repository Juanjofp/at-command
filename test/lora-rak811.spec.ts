import { ATSerialPort, CommandRunnerBuilder, Rak811 } from '@/main';
import { CommandRunnerBuilderMock } from '@/mocks';

const serialPath = '/dev/tty.usbmodem214301';

describe('Sigfox rak811', () => {
    let rak811: Rak811.SigfoxRak811;
    beforeAll(async () => {
        const serialPort = await CommandRunnerBuilder.buildSerialPort(
            serialPath,
            {
                baudRate: 115200
            }
        );
        rak811 = Rak811.buildRak811(serialPort);
    });

    it('should get its version', async () => {
        const version = await rak811.getVersion();
        expect(version).toBe('V3.0.0.14.H');
    });

    it('should get configuration info', async () => {
        const info = await rak811.getInformation();
        expect(info.region).toEqual('EU868');
        expect(info.joinMode).toEqual('OTAA');
        expect(info.devEui).toEqual('AC1F09FFFE04891A');
        expect(info.appEui).toEqual('AC1F09FFF8680811');
        expect(info.appKey).toEqual('AC1F09FFFE04891AAC1F09FFF8680811');
        expect(info.classType).toEqual('A');
        expect(info.isJoined).toBe(false);
    });
});

describe('Mock Sigfox rak811', () => {
    let rak811: Rak811.SigfoxRak811;
    let atPort: ATSerialPort;

    beforeAll(async () => {
        atPort = await CommandRunnerBuilderMock.buildSerialPort(serialPath);
        rak811 = Rak811.buildRak811(atPort);
    });

    beforeEach(async () => {
        CommandRunnerBuilderMock.mockClear();
    });

    it('should get its version', async () => {
        CommandRunnerBuilderMock.mockReadFromSerialPort('OK V3.0.0.14.H');

        const version = await rak811.getVersion();
        expect(version).toEqual('V3.0.0.14.H');
    });

    it('should throw an exception when command fails', async () => {
        expect.assertions(2);
        try {
            await rak811.getVersion();
        } catch (error) {
            if (error instanceof Error) {
                expect(error.message).toBe(
                    'Timeout error: 0 lines received for command: at+version'
                );
            }
            expect(atPort.isOpen()).toBe(false);
        }
    });
});
