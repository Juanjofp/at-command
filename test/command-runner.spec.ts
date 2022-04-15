import { CommandRunnerBuilder } from '@/main';
import { CommandRunnerBuilderMock } from '@/mocks';

const serialPath = '/dev/tty.usbmodem214301';

describe('command-runner', () => {
    it('should return a list of SerialPorts', async () => {
        const list = await CommandRunnerBuilder.getSerialPortList();
        expect(list).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    path: expect.any(String),
                    manufacturer: expect.any(String),
                    serialNumber: expect.any(String),
                    vendorId: expect.any(String),
                    productId: expect.any(String)
                })
            ])
        );
    });

    it('should return a closed serial port', async () => {
        const port = await CommandRunnerBuilder.buildSerialPort(serialPath);
        expect(port.isOpen()).toBe(false);
    });

    it('should open and close a serialport', async () => {
        const port = await CommandRunnerBuilder.buildSerialPort(serialPath);
        expect(port.isOpen()).toBe(false);
        await port.open();
        expect(port.isOpen()).toBe(true);
        await port.close();
        expect(port.isOpen()).toBe(false);
    });

    it('should throw an exception with invalid path', async () => {
        expect.assertions(1);
        try {
            await CommandRunnerBuilder.buildSerialPort('/invalid/path');
        } catch (error) {
            if (error instanceof Error) {
                expect(error.message).toBe(
                    'Error: No such file or directory, cannot open /invalid/path'
                );
            }
        }
    });

    it.skip('should run a command and get response', async () => {
        const port = await CommandRunnerBuilder.buildSerialPort(serialPath);
        const runner = CommandRunnerBuilder.buildCommandRunner(port);

        try {
            await runner.open();
            const response = await runner.runCommand('at+version');
            expect(response).toBe('OK');
        } finally {
            await runner.close();
        }
    });
});

describe('command-runner Mock', () => {
    beforeEach(() => {
        CommandRunnerBuilderMock.mockClear();
    });

    it('should return a list of SerialPorts', async () => {
        const expectedList = [
            {
                path: serialPath,
                manufacturer: 'Arduino',
                serialNumber: '123456789',
                vendorId: '2341',
                productId: '0043'
            }
        ];
        CommandRunnerBuilderMock.mockGetSerialPortList(expectedList);
        const list = await CommandRunnerBuilderMock.getSerialPortList();
        expect(list).toEqual(expectedList);
    });

    it('should return an EMPTY list of SerialPorts', async () => {
        CommandRunnerBuilderMock.mockGetSerialPortList([]);
        const list = await CommandRunnerBuilderMock.getSerialPortList();
        expect(list).toEqual([]);
    });

    it('should return a closed serial port', async () => {
        const port = await CommandRunnerBuilderMock.buildSerialPort(serialPath);
        expect(port.isOpen()).toBe(false);
    });

    it('should open and close a serialport', async () => {
        const port = await CommandRunnerBuilderMock.buildSerialPort(serialPath);
        expect(port.isOpen()).toBe(false);
        await port.open();
        expect(port.isOpen()).toBe(true);
        await port.close();
        expect(port.isOpen()).toBe(false);
    });

    it('should throw an exception with invalid path', async () => {
        expect.assertions(1);
        const invalidPath = '/invalid/path';
        CommandRunnerBuilderMock.mockCreateSerialPortThrowError(
            new Error(
                `Error: No such file or directory, cannot open ${invalidPath}`
            )
        );
        try {
            await CommandRunnerBuilderMock.buildSerialPort(invalidPath);
        } catch (error) {
            if (error instanceof Error) {
                expect(error.message).toBe(
                    'Error: No such file or directory, cannot open /invalid/path'
                );
            }
        }
    });
});
