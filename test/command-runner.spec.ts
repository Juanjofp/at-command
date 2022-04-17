import { CommandRunnerBuilder, RunCommandTimeoutError } from '@/main';
import { CommandRunnerBuilderMock } from '@/mocks';

const serialPath = '/dev/tty.usbmodem214301';

describe.skip('command-runner', () => {
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

    it('should open once', async () => {
        const port = await CommandRunnerBuilder.buildSerialPort(serialPath);
        expect(port.isOpen()).toBe(false);
        await port.open();
        expect(port.isOpen()).toBe(true);
        await port.open();
        expect(port.isOpen()).toBe(true);
        await port.open();
        expect(port.isOpen()).toBe(true);
        await port.close();
        expect(port.isOpen()).toBe(false);
    });

    it('should close once', async () => {
        const port = await CommandRunnerBuilder.buildSerialPort(serialPath);
        expect(port.isOpen()).toBe(false);
        await port.open();
        expect(port.isOpen()).toBe(true);
        await port.close();
        expect(port.isOpen()).toBe(false);
        await port.close();
        expect(port.isOpen()).toBe(false);
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

    it('should run a command and get response', async () => {
        const port = await CommandRunnerBuilder.buildSerialPort(serialPath);
        const runner = CommandRunnerBuilder.buildCommandRunner(port);

        try {
            await runner.open();
            const response = await runner.executeCommand('at+version');
            expect(response).toEqual({
                data: ['OK V3.0.0.14.H'],
                command: 'at+version'
            });
        } finally {
            await runner.close();
        }
    });

    it('should throw an error if not respond in 3 seconds', async () => {
        expect.assertions(1);
        const port = await CommandRunnerBuilder.buildSerialPort(serialPath, {
            baudRate: 9600
        });
        const runner = CommandRunnerBuilder.buildCommandRunner(port);

        try {
            await runner.open();
            await runner.executeCommand('at+version', { timeout: 3000 });
        } catch (error) {
            if (error instanceof Error) {
                expect(error.message).toBe(
                    'Timeout error: 0 lines received for command: at+version'
                );
            }
        } finally {
            await runner.close();
        }
    });

    it('should throw an error if not validation match', async () => {
        expect.assertions(3);
        const port = await CommandRunnerBuilder.buildSerialPort(serialPath);
        const runner = CommandRunnerBuilder.buildCommandRunner(port);

        try {
            await runner.open();
            await runner.executeCommand('at+version', {
                timeout: 1000,
                validation: () => false
            });
        } catch (error) {
            if (error instanceof RunCommandTimeoutError) {
                expect(error.message).toBe(
                    'Timeout error: 1 lines received for command: at+version'
                );
                expect(error.command).toEqual('at+version');
                expect(error.dataReceived).toEqual(['OK V3.0.0.14.H']);
            }
        } finally {
            await runner.close();
        }
    });

    it('should run a set of commands and get responses', async () => {
        const port = await CommandRunnerBuilder.buildSerialPort(serialPath);
        const runner = CommandRunnerBuilder.buildCommandRunner(port);

        const responses = await runner.runCommands([
            () => runner.executeCommand('at+version'),
            () => runner.executeCommand('at+version')
        ]);

        expect(responses).toEqual([
            {
                data: ['OK V3.0.0.14.H'],
                command: 'at+version'
            },
            {
                data: ['OK V3.0.0.14.H'],
                command: 'at+version'
            }
        ]);
    });

    it('should run a complex command and get response', async () => {
        const port = await CommandRunnerBuilder.buildSerialPort(serialPath);
        const runner = CommandRunnerBuilder.buildCommandRunner(port);

        const complexCommand = async function () {
            const resp1 = await runner.executeCommand('at+version');
            const resp2 = await runner.executeCommand('at+version');
            return {
                data: [resp1.data[0], resp2.data[0]],
                command: 'at+version'
            };
        };

        const response = await runner.runCommand(complexCommand);

        expect(response).toEqual({
            command: 'at+version',
            data: ['OK V3.0.0.14.H', 'OK V3.0.0.14.H']
        });
    });
});

describe.skip('command-runner Mock', () => {
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

    it('should run a command and get response', async () => {
        const port = await CommandRunnerBuilderMock.buildSerialPort(serialPath);
        const runner = CommandRunnerBuilderMock.buildCommandRunner(port);
        CommandRunnerBuilderMock.mockReadFromSerialPort(['OK V3.0.0.14.H']);
        try {
            await runner.open();
            const response = await runner.executeCommand('at+version');
            expect(response).toEqual({
                data: ['OK V3.0.0.14.H'],
                command: 'at+version'
            });
        } finally {
            await runner.close();
        }
    });

    it('should throw an error if not respond in 3 seconds', async () => {
        expect.assertions(1);
        const port = await CommandRunnerBuilderMock.buildSerialPort(serialPath);
        const runner = CommandRunnerBuilderMock.buildCommandRunner(port);

        try {
            await runner.open();
            await runner.executeCommand('at+version', { timeout: 3000 });
        } catch (error) {
            if (error instanceof Error) {
                expect(error.message).toBe(
                    'Timeout error: 0 lines received for command: at+version'
                );
            }
        } finally {
            await runner.close();
        }
    });

    it('should throw an error if not validation match', async () => {
        expect.assertions(3);
        const port = await CommandRunnerBuilderMock.buildSerialPort(serialPath);
        const runner = CommandRunnerBuilderMock.buildCommandRunner(port);
        CommandRunnerBuilderMock.mockReadFromSerialPort(['OK V3.0.0.14.H']);

        try {
            await runner.open();
            await runner.executeCommand('at+version', {
                timeout: 1000,
                validation: () => false
            });
        } catch (error) {
            if (error instanceof RunCommandTimeoutError) {
                expect(error.message).toBe(
                    'Timeout error: 1 lines received for command: at+version'
                );
                expect(error.command).toBe('at+version');
                expect(error.dataReceived).toEqual(['OK V3.0.0.14.H']);
            }
        } finally {
            await runner.close();
        }
    });

    it('should run a set of commands and get responses', async () => {
        const port = await CommandRunnerBuilder.buildSerialPort(serialPath);
        const runner = CommandRunnerBuilder.buildCommandRunner(port);
        CommandRunnerBuilderMock.mockReadFromSerialPort(['OK V3.0.0.14.H']);

        const responses = await runner.runCommands([
            () => runner.executeCommand('at+version'),
            () => runner.executeCommand('at+version')
        ]);

        expect(responses).toEqual([
            {
                data: ['OK V3.0.0.14.H'],
                command: 'at+version'
            },
            {
                data: ['OK V3.0.0.14.H'],
                command: 'at+version'
            }
        ]);
    });

    it('should run a set of commands and catch errors', async () => {
        expect.assertions(1);
        const port = await CommandRunnerBuilder.buildSerialPort(serialPath);
        const runner = CommandRunnerBuilder.buildCommandRunner(port);
        CommandRunnerBuilderMock.mockReadFromSerialPort(['OK V3.0.0.14.H']);

        try {
            await runner.runCommands([
                () => runner.executeCommand('at+version'),
                async () => {
                    throw new Error(`Error in middle of commands`);
                },
                () => runner.executeCommand('at+version')
            ]);
        } catch (error) {
            expect(error).toEqual(new Error(`Error in middle of commands`));
        }
    });

    it('should run a complex command and get response', async () => {
        CommandRunnerBuilderMock.mockReadFromSerialPort(['OK V3.0.0.14.H']);
        const port = await CommandRunnerBuilder.buildSerialPort(serialPath);
        const runner = CommandRunnerBuilder.buildCommandRunner(port);

        const complexCommand = async function () {
            const resp1 = await runner.executeCommand('at+version');
            const resp2 = await runner.executeCommand('at+version');
            return {
                data: [resp1.data[0], resp2.data[0]],
                command: 'at+version'
            };
        };

        const response = await runner.runCommand(complexCommand);

        expect(response).toEqual({
            command: 'at+version',
            data: ['OK V3.0.0.14.H', 'OK V3.0.0.14.H']
        });
    });
});
