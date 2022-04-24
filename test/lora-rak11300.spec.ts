import { ATSerialPortBuilder, LoraResponseError, Rak11300 } from '@/index';

const serialPath = '/dev/tty.usbmodem1101';
jest.setTimeout(50000);

describe('LoRa rak11300', () => {
    let rak11300: Rak11300.LoraRak11300;
    beforeAll(async () => {
        const serialPort = await ATSerialPortBuilder.buildSerialPort(
            serialPath
        );
        rak11300 = Rak11300.buildRak11300(serialPort);
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

    it('should fails when try to set a invalid APP EUI', async () => {
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

    // it('should join with a gateway', async () => {
    //     await rak811.join({ timeout: 10000 });
    // });
    //
    // it('should send an unconfirmed frame to gateway', async () => {
    //     await rak811.sendUnconfirmedData('01020304');
    // });
    //
    // it.skip('should send a confirmed frame to gateway', async () => {
    //     const response = await rak811.sendConfirmedData('010203');
    //
    //     expect(response.data).toEqual('');
    //     expect(response.port).toEqual(0);
    //     expect(response.rssi).toEqual(-128);
    //     expect(response.snr).toEqual(0);
    // });
    //
    // it.skip('should send an unconfirmed frame to gateway and receive response', async () => {
    //     const response = await rak811.sendUnconfirmedDataAndWaitForResponse(
    //         '03010204',
    //         { timeout: 30000 }
    //     );
    //
    //     expect(response.data).toEqual('');
    //     expect(response.port).toEqual(0);
    //     expect(response.rssi).toEqual(-128);
    //     expect(response.snr).toEqual(0);
    // });
    //
    // it.skip('should send a confirmed frame to gateway and receive response', async () => {
    //     const response = await rak811.sendConfirmedDataAndWaitForResponse(
    //         '202122'
    //     );
    //
    //     expect(response.data).toEqual('');
    //     expect(response.port).toEqual(0);
    //     expect(response.rssi).toEqual(-128);
    //     expect(response.snr).toEqual(0);
    // });
});

// GetVersion
//       [ 'AT+VER=?\r', '+VER:1.0.0 Apr 21 2022 16:04:06', 'OK' ]
// Get Information
// [
//     'AT+STATUS=?\rDevice status:\n' +
//     '   Auto join enabled\n' +
//     '   Mode LPWAN\n' +
//     'LPWAN status:\n' +
//     '   Marks: AA 55\n' +
//     '   Dev EUI E660CCC14B738A30\n' +
//     '   App EUI 308A734BC1CC60E6\n' +
//     '   App Key E660CCC14B738A30308A734BC1CC60E6\n' +
//     '   Dev Addr 4634BEBA\n' +
//     '   NWS Key E660CCC14B738A30308A734BC1CC60E6\n' +
//     '   Apps Key E660CCC14B738A30308A734BC1CC60E6\n' +
//     '   OTAA enabled\n' +
//     '   ADR enabled\n' +
//     '   Public Network\n' +
//     '   Dutycycle disabled\n' +
//     '   Repeat time 0\n' +
//     '   Join trials 10\n' +
//     '   TX Power 0\n' +
//     '   DR 3\n' +
//     '   Class 0\n' +
//     '   Subband 1\n' +
//     '   Fport 2\n' +
//     '   Unconfirmed Message\n' +
//     '   Region EU868\n' +
//     '   Network not joined\n' +
//     'LoRa P2P status:\n' +
//     '   P2P frequency 916000000\n' +
//     '   P2P TX Power 22\n' +
//     '   P2P BW 125\n' +
//     '   P2P SF 7\n' +
//     '   P2P CR 1\n' +
//     '   P2P Preamble length 8\n' +
//     '   P2P Symbol Timeout 0\n',
//     '+STATUS: ',
//     'OK'
// ]
