import {
    ATSerialPort,
    ATSerialPortBuilder,
    buildCommandRunnerMock,
    LoraResponseError,
    Rak11300
} from '@/index';

const serialPath = '/dev/tty.usbmodem21201';
jest.setTimeout(50000);

describe.skip('LoRa rak11300', () => {
    let rak11300: Rak11300.LoraRak11300;
    beforeAll(async () => {
        const serialPort = await ATSerialPortBuilder.buildSerialPort(
            serialPath
        );
        rak11300 = Rak11300.buildRak11300(serialPort, { debug: true });
    });

    it('should get its version', async () => {
        const version = await rak11300.getVersion();
        expect(version).toBe('1.0.0');
    });

    it('should get configuration info', async () => {
        const info = await rak11300.getInformation();

        expect(info.region).toEqual('EU868');
        expect(info.joinMode).toEqual('OTAA');
        expect(info.devEui).toEqual('E660CCC14B738A30');
        expect(info.appEui).toEqual('308A734BC1CC60E6');
        expect(info.appKey).toEqual('E660CCC14B738A30308A734BC1CC60E6');
        expect(info.classType).toEqual('A');
        expect(info.isConfirm).toEqual(false);
        expect(info.isJoined).toBe(true);
        expect(info.isAutoJoined).toBe(true);

        expect(info.devAddress).toEqual('4634BEBA');
        expect(info.nwksKey).toEqual('E660CCC14B738A30308A734BC1CC60E6');
        expect(info.appsKey).toEqual('E660CCC14B738A30308A734BC1CC60E6');
        expect(info.isDutyCycle).toBe(false);
    });

    it('should fails when try to set a invalid device EUI', async () => {
        expect.assertions(2);
        const devEui = 'E660CCC14B738A30';

        try {
            await rak11300.setDeviceEui('invalid');
        } catch (error) {
            if (error instanceof LoraResponseError) {
                expect(error.message).toBe(
                    `Lora error code 5: Invalid parameter in the AT command`
                );
                const info = await rak11300.getInformation();
                expect(info.devEui).toEqual(devEui);
            }
        }
    });

    it('should set a valid device EUI', async () => {
        const devEui = 'E660CCC14B738A30';

        await rak11300.setDeviceEui(devEui);
        const info = await rak11300.getInformation();

        expect(info.devEui).toEqual(devEui);
    });

    it.only('should fails when try to set a invalid APP EUI', async () => {
        expect.assertions(2);
        const appEui = '308A734BC1CC60E6';

        try {
            await rak11300.setAppEui('invalid');
        } catch (error) {
            if (error instanceof LoraResponseError) {
                expect(error.message).toBe(
                    `Lora error code 5: Invalid parameter in the AT command`
                );
                const info = await rak11300.getInformation();
                expect(info.appEui).toEqual(appEui);
            }
        }
    });

    it('should set a valid APP EUI', async () => {
        const appEui = '308A734BC1CC60E6';

        await rak11300.setAppEui(appEui);

        const info = await rak11300.getInformation();
        expect(info.appEui).toEqual(appEui);
    });

    it('should fails when try to set a invalid App Key', async () => {
        expect.assertions(2);
        const appKey = 'E660CCC14B738A30308A734BC1CC60E6';

        try {
            await rak11300.setAppKey('invalid');
        } catch (error) {
            if (error instanceof LoraResponseError) {
                expect(error.message).toBe(
                    `Lora error code 5: Invalid parameter in the AT command`
                );
                const info = await rak11300.getInformation();
                expect(info.appKey).toEqual(appKey);
            }
        }
    });

    it('should set a valid APP Key', async () => {
        const appKey = 'E660CCC14B738A30308A734BC1CC60E6';

        await rak11300.setAppKey(appKey);

        const info = await rak11300.getInformation();
        expect(info.appKey).toEqual(appKey);
    });

    it('should fails when try to set a invalid Apps Key', async () => {
        expect.assertions(2);
        const appsKey = 'E660CCC14B738A30308A734BC1CC60E6';

        try {
            await rak11300.setAppKey('invalid');
        } catch (error) {
            if (error instanceof LoraResponseError) {
                expect(error.message).toBe(
                    `Lora error code 5: Invalid parameter in the AT command`
                );
                const info = await rak11300.getInformation();
                expect(info.appKey).toEqual(appsKey);
            }
        }
    });

    it('should set a valid APPs Key', async () => {
        const appsKey = 'E660CCC14B738A30308A734BC1CC60E6';

        await rak11300.setAppsKey(appsKey);

        const info = await rak11300.getInformation();
        expect(info.appsKey).toEqual(appsKey);
    });

    it('should fails when try to set a invalid Network Key', async () => {
        expect.assertions(2);
        const nwsKey = 'E660CCC14B738A30308A734BC1CC60E6';

        try {
            await rak11300.setNwksKey('invalid');
        } catch (error) {
            if (error instanceof LoraResponseError) {
                expect(error.message).toBe(
                    `Lora error code 5: Invalid parameter in the AT command`
                );
                const info = await rak11300.getInformation();
                expect(info.appKey).toEqual(nwsKey);
            }
        }
    });

    it('should set a valid Network Key', async () => {
        const nwsKey = 'E660CCC14B738A30308A734BC1CC60E6';

        await rak11300.setNwksKey(nwsKey);

        const info = await rak11300.getInformation();
        expect(info.nwksKey).toEqual(nwsKey);
    });

    it('should fails when try to set a invalid device address', async () => {
        expect.assertions(2);
        const deviceAddress = '4634BEBA';

        try {
            await rak11300.setDevAddress('invalid');
        } catch (error) {
            if (error instanceof LoraResponseError) {
                expect(error.message).toBe(
                    `Lora error code 5: Invalid parameter in the AT command`
                );
                const info = await rak11300.getInformation();
                expect(info.devAddress).toEqual(deviceAddress);
            }
        }
    });

    it('should set a valid device address', async () => {
        const deviceAddress = '4634BEBA';

        await rak11300.setDevAddress(deviceAddress);

        const info = await rak11300.getInformation();
        expect(info.devAddress).toEqual(deviceAddress);
    });

    it('should change message confirmation', async () => {
        const info = await rak11300.getInformation();
        const toggleConfirmation = !info.isConfirm;
        await rak11300.setNeedsConfirmation(toggleConfirmation);

        const infoChanged = await rak11300.getInformation();
        expect(infoChanged.isConfirm).toEqual(toggleConfirmation);

        await rak11300.setNeedsConfirmation(false);
        const restoredInfo = await rak11300.getInformation();
        expect(restoredInfo.isConfirm).toEqual(false);
    });

    it.skip('should reset the device', async () => {
        await rak11300.reset();

        const info = await rak11300.getInformation();
        expect(info).toBeTruthy();
    });

    it('should change auto join', async () => {
        const info = await rak11300.getInformation();
        const toggleAutoJoin = !info.isAutoJoined;

        await rak11300.setAutoJoin(toggleAutoJoin);

        const expectedInfo = await rak11300.getInformation();
        expect(expectedInfo.isAutoJoined).toEqual(toggleAutoJoin);

        await rak11300.setAutoJoin(true);

        const infoAutoJoinEnabled = await rak11300.getInformation();
        expect(infoAutoJoinEnabled.isAutoJoined).toEqual(true);
    });

    it.skip('should join and leave with a gateway', async () => {
        await rak11300.setAutoJoin(true);
        await rak11300.join();

        let info = await rak11300.getInformation();
        expect(info.isJoined).toEqual(true);

        await rak11300.leave();

        info = await rak11300.getInformation();
        expect(info.isJoined).toEqual(false);
    });

    it('should send an unconfirmed frame to gateway', async () => {
        await rak11300.sendUnconfirmedData('0102030405');
    });

    it.skip('should send an unconfirmed frame to gateway and receive response', async () => {
        const response = await rak11300.sendUnconfirmedDataAndWaitForResponse(
            '03010204',
            { timeout: 45000 }
        );

        expect(response.data).toEqual('');
        expect(response.port).toEqual(0);
        expect(response.rssi).toEqual(-128);
        expect(response.snr).toEqual(0);
    });
});

describe('Mock LoRa rak11300 should', () => {
    let rak11300: Rak11300.LoraRak11300;
    let atPort: ATSerialPort;
    const commandRunnerMock = buildCommandRunnerMock();
    const infoData = commandRunnerMock.mockGenerateInfo('RAK11300');

    beforeAll(async () => {
        atPort = await commandRunnerMock.buildSerialPort(serialPath);
        rak11300 = Rak11300.buildRak11300(atPort, {
            commandTimeout: 200
        });
    });

    beforeEach(() => {
        commandRunnerMock.mockClear();
    });

    it('get its version', async () => {
        commandRunnerMock.mockReadFromSerialPortOnce(
            commandRunnerMock.mockGenerateVersion('RAK11300')
        );

        const version = await rak11300.getVersion();

        expect(version).toEqual('1.0.0');
    });

    it('should throw an exception when command fails', async () => {
        expect.assertions(2);
        try {
            await rak11300.getVersion();
        } catch (error) {
            if (error instanceof Error) {
                expect(error.message).toBe(
                    'Timeout error: 0 lines received for command: AT+VER=?'
                );
            }
            expect(atPort.isOpen()).toBe(false);
        }
    });

    it('should get configuration info', async () => {
        commandRunnerMock.mockReadFromSerialPortOnce(infoData);

        const info = await rak11300.getInformation();

        expect(info.region).toEqual('EU868');
        expect(info.joinMode).toEqual('OTAA');
        expect(info.devEui).toEqual('E660CCC14B738A30');
        expect(info.appEui).toEqual('308A734BC1CC60E6');
        expect(info.appKey).toEqual('E660CCC14B738A30308A734BC1CC60E6');
        expect(info.classType).toEqual('A');
        expect(info.isConfirm).toEqual(false);
        expect(info.isJoined).toBe(false);
    });

    it.skip('should get configuration info with AppEui unknown', async () => {
        const fakeInfo = infoData.slice();
        fakeInfo[0] = fakeInfo[0]
            .slice()
            .replace('   App EUI 308A734BC1CC60E6\n', '');
        console.log('mock data +++++++++++', fakeInfo);
        commandRunnerMock.mockReadFromSerialPortOnce(fakeInfo);

        const info = await rak11300.getInformation();

        expect(info.region).toEqual('EU868');
        expect(info.joinMode).toEqual('OTAA');
        expect(info.devEui).toEqual('E660CCC14B738A30');
        expect(info.appEui).toEqual('unknown');
        expect(info.appKey).toEqual('AC1F09FFFE04891AAC1F09FFF8680811');
        expect(info.classType).toEqual('A');
        expect(info.isJoined).toBe(false);
    });

    it('should set a valid device EUI', async () => {
        const devEui = 'E660CCC14B738A30';
        commandRunnerMock.mockReadFromSerialPortOnce(
            commandRunnerMock.mockGenerateValidResponse('RAK11300')
        );
        commandRunnerMock.mockReadFromSerialPort(infoData);

        await rak11300.setDeviceEui(devEui);
        const info = await rak11300.getInformation();
        expect(info.devEui).toEqual(devEui);
    });

    it('should set a invalid device EUI', async () => {
        expect.assertions(3);
        const devEui = 'E660CCC14B738A30';
        commandRunnerMock.mockReadFromSerialPortOnce(
            commandRunnerMock.mockGenerateError('RAK11300', 5)
        );
        commandRunnerMock.mockReadFromSerialPort(infoData);

        try {
            await rak11300.setDeviceEui('invalid');
        } catch (error) {
            if (error instanceof LoraResponseError) {
                expect(error.message).toBe(
                    `Lora error code 5: Invalid parameter in the AT command`
                );
                expect(error.getLoraError()).toEqual({
                    model: 'RAK11300',
                    code: 5,
                    description: 'Invalid parameter in the AT command'
                });
                const info = await rak11300.getInformation();
                expect(info.devEui).toEqual(devEui);
            }
        }
    });

    it('should manage unknown error responses', async () => {
        expect.assertions(1);
        commandRunnerMock.mockReadFromSerialPortOnce(
            commandRunnerMock.mockGenerateError('RAK11300', 999)
        );

        try {
            await rak11300.setDeviceEui('invalid');
        } catch (error) {
            if (error instanceof LoraResponseError) {
                expect(error.message).toBe(
                    `Lora error code 999: Unknown error code 999`
                );
            }
        }
    });

    it('should manage unknown responses', async () => {
        expect.assertions(1);
        commandRunnerMock.mockReadFromSerialPortOnce(['unknown response']);

        try {
            await rak11300.setDeviceEui('invalid');
        } catch (error) {
            if (error instanceof Error) {
                expect(error.message).toBe(
                    `Timeout error: 1 lines received for command: AT+DEVEUI=invalid`
                );
            }
        }
    });

    it('should set a invalid APP EUI', async () => {
        expect.assertions(2);
        const appEui = '308A734BC1CC60E6';
        commandRunnerMock.mockReadFromSerialPortOnce(
            commandRunnerMock.mockGenerateError('RAK11300', 5)
        );
        commandRunnerMock.mockReadFromSerialPort(infoData);

        try {
            await rak11300.setAppEui('invalid');
        } catch (error) {
            if (error instanceof LoraResponseError) {
                expect(error.message).toBe(
                    `Lora error code 5: Invalid parameter in the AT command`
                );
                const info = await rak11300.getInformation();
                expect(info.appEui).toEqual(appEui);
            }
        }
    });

    it('should set a valid APP EUI', async () => {
        const appEui = '308A734BC1CC60E6';
        commandRunnerMock.mockReadFromSerialPortOnce(
            commandRunnerMock.mockGenerateValidResponse('RAK11300')
        );
        commandRunnerMock.mockReadFromSerialPort(infoData);

        await rak11300.setAppEui(appEui);
        const info = await rak11300.getInformation();
        expect(info.appEui).toEqual(appEui);
    });

    it('should set a invalid App Key', async () => {
        expect.assertions(2);
        const appKey = 'E660CCC14B738A30308A734BC1CC60E6';
        commandRunnerMock.mockReadFromSerialPortOnce(
            commandRunnerMock.mockGenerateError('RAK11300', 5)
        );
        commandRunnerMock.mockReadFromSerialPort(infoData);

        try {
            await rak11300.setAppKey('invalid');
        } catch (error) {
            if (error instanceof LoraResponseError) {
                expect(error.message).toBe(
                    `Lora error code 5: Invalid parameter in the AT command`
                );
                const info = await rak11300.getInformation();
                expect(info.appKey).toEqual(appKey);
            }
        }
    });

    it('should set a valid APP EUI', async () => {
        commandRunnerMock.mockReadFromSerialPortOnce(
            commandRunnerMock.mockGenerateValidResponse('RAK11300')
        );
        commandRunnerMock.mockReadFromSerialPort(infoData);
        const appKey = 'E660CCC14B738A30308A734BC1CC60E6';

        await rak11300.setAppKey(appKey);

        const info = await rak11300.getInformation();
        expect(info.appKey).toEqual(appKey);
    });

    it.skip('should join successfully', async () => {
        commandRunnerMock.mockReadFromSerialPortOnce(infoData);
        commandRunnerMock.mockReadFromSerialPortOnce(
            commandRunnerMock.mockGenerateJoinSuccess('RAK11300')
        );

        await rak11300.join();
    });
});

// SEND DATA
// console.log
// <Info> Executing Command AT+SEND=2:03010204
//
// at Object.info (src/log-service/index.ts:3:17)
//
// console.log
// <Info> [SerialPort] Received line AT+SEND=2:03010204
//
// at Object.info (src/log-service/index.ts:3:17)
//
// console.log
// <Info> [SerialPort] Received line OK
