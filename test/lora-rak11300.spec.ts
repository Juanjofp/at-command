import { ATSerialPortBuilder, Rak11300 } from '@/index';

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

    it.skip('should get configuration info', async () => {
        const info = await rak11300.getInformation();

        expect(info.region).toEqual('EU868');
        // expect(info.joinMode).toEqual('OTAA');
        // expect(info.devEui).toEqual('AC1F09FFFE04891A');
        // expect(info.appEui).toEqual('AC1F09FFF8680811');
        // expect(info.appKey).toEqual('AC1F09FFFE04891AAC1F09FFF8680811');
        // expect(info.classType).toEqual('A');
        // expect(info.isConfirm).toEqual(false);
        // expect(info.isJoined).toBe(true);
    });

    // it('should set a invalid device EUI', async () => {
    //     expect.assertions(2);
    //     const devEui = 'AC1F09FFFE04891A';
    //
    //     try {
    //         await rak811.setDeviceEui('invalid');
    //     } catch (error) {
    //         if (error instanceof LoraResponseError) {
    //             expect(error.message).toBe(
    //                 `Lora error code 2: Invalid parameter in the AT command`
    //             );
    //             const info = await rak811.getInformation();
    //             expect(info.devEui).toEqual(devEui);
    //         }
    //     }
    // });
    //
    // it('should set a valid device EUI', async () => {
    //     const devEui = 'AC1F09FFFE04891A';
    //
    //     await rak811.setDeviceEui(devEui);
    //     const info = await rak811.getInformation();
    //
    //     expect(info.devEui).toEqual(devEui);
    // });
    //
    // it('should set a invalid APP EUI', async () => {
    //     expect.assertions(2);
    //     const appEui = 'AC1F09FFF8680811';
    //
    //     try {
    //         await rak811.setAppEui('invalid');
    //     } catch (error) {
    //         if (error instanceof LoraResponseError) {
    //             expect(error.message).toBe(
    //                 `Lora error code 2: Invalid parameter in the AT command`
    //             );
    //             const info = await rak811.getInformation();
    //             expect(info.appEui).toEqual(appEui);
    //         }
    //     }
    // });
    //
    // it('should set a valid APP EUI', async () => {
    //     const appEui = 'AC1F09FFF8680811';
    //
    //     await rak811.setAppEui(appEui);
    //
    //     const info = await rak811.getInformation();
    //     expect(info.appEui).toEqual(appEui);
    // });
    //
    // it('should set a invalid App Key', async () => {
    //     expect.assertions(2);
    //     const appKey = 'AC1F09FFFE04891AAC1F09FFF8680811';
    //
    //     try {
    //         await rak811.setAppKey('invalid');
    //     } catch (error) {
    //         if (error instanceof LoraResponseError) {
    //             expect(error.message).toBe(
    //                 `Lora error code 2: Invalid parameter in the AT command`
    //             );
    //             const info = await rak811.getInformation();
    //             expect(info.appKey).toEqual(appKey);
    //         }
    //     }
    // });
    //
    // it('should set a valid APP EUI', async () => {
    //     const appKey = 'AC1F09FFFE04891AAC1F09FFF8680811';
    //
    //     await rak811.setAppKey(appKey);
    //
    //     const info = await rak811.getInformation();
    //     expect(info.appKey).toEqual(appKey);
    // });
    //
    // it('should join send a frame to gateway', async () => {
    //     await rak811.join({ timeout: 10000 });
    // });
    //
    // it('should change message confirmation', async () => {
    //     const info = await rak811.getInformation();
    //     const toggleConfirmation = !info.isConfirm;
    //     await rak811.needsConfirmation(toggleConfirmation);
    //
    //     const infoChanged = await rak811.getInformation();
    //     expect(infoChanged.isConfirm).toEqual(toggleConfirmation);
    //
    //     await rak811.needsConfirmation(false);
    //     const restoredInfo = await rak811.getInformation();
    //     expect(restoredInfo.isConfirm).toEqual(false);
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
