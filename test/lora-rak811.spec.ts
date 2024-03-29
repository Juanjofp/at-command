import {
  ATSerialPort,
  ATSerialPortBuilder,
  LoraResponseError,
  Rak811,
  buildCommandRunnerMock
} from '@/index';

const serialPath = '/dev/tty.usbmodem214301';
jest.setTimeout(60000);

describe.skip('LoRa rak811', () => {
  let rak811: Rak811.LoraRak811;
  beforeAll(async () => {
    const serialPort = await ATSerialPortBuilder.buildSerialPort(serialPath, {
      baudRate: 115200
    });
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
    expect(info.isConfirm).toEqual(false);
    expect(info.isJoined).toBe(true);
  });

  it('should set a invalid device EUI', async () => {
    expect.assertions(2);
    const devEui = 'AC1F09FFFE04891A';

    try {
      await rak811.setDeviceEui('invalid');
    } catch (error) {
      if (error instanceof LoraResponseError) {
        expect(error.message).toBe(
          `Lora error code 2: Invalid parameter in the AT command`
        );
        const info = await rak811.getInformation();
        expect(info.devEui).toEqual(devEui);
      }
    }
  });

  it('should set a valid device EUI', async () => {
    const devEui = 'AC1F09FFFE04891A';

    await rak811.setDeviceEui(devEui);
    const info = await rak811.getInformation();

    expect(info.devEui).toEqual(devEui);
  });

  it('should set a invalid APP EUI', async () => {
    expect.assertions(2);
    const appEui = 'AC1F09FFF8680811';

    try {
      await rak811.setAppEui('invalid');
    } catch (error) {
      if (error instanceof LoraResponseError) {
        expect(error.message).toBe(
          `Lora error code 2: Invalid parameter in the AT command`
        );
        const info = await rak811.getInformation();
        expect(info.appEui).toEqual(appEui);
      }
    }
  });

  it('should set a valid APP EUI', async () => {
    const appEui = 'AC1F09FFF8680811';

    await rak811.setAppEui(appEui);

    const info = await rak811.getInformation();
    expect(info.appEui).toEqual(appEui);
  });

  it('should set a invalid App Key', async () => {
    expect.assertions(2);
    const appKey = 'AC1F09FFFE04891AAC1F09FFF8680811';

    try {
      await rak811.setAppKey('invalid');
    } catch (error) {
      if (error instanceof LoraResponseError) {
        expect(error.message).toBe(
          `Lora error code 2: Invalid parameter in the AT command`
        );
        const info = await rak811.getInformation();
        expect(info.appKey).toEqual(appKey);
      }
    }
  });

  it('should set a valid APP EUI', async () => {
    const appKey = 'AC1F09FFFE04891AAC1F09FFF8680811';

    await rak811.setAppKey(appKey);

    const info = await rak811.getInformation();
    expect(info.appKey).toEqual(appKey);
  });

  it('should join send a frame to gateway', async () => {
    await rak811.join({ timeout: 10000 });
  });

  it('should change message confirmation', async () => {
    const info = await rak811.getInformation();
    const toggleConfirmation = !info.isConfirm;
    await rak811.setNeedsConfirmation(toggleConfirmation);

    const infoChanged = await rak811.getInformation();
    expect(infoChanged.isConfirm).toEqual(toggleConfirmation);

    await rak811.setNeedsConfirmation(false);
    const restoredInfo = await rak811.getInformation();
    expect(restoredInfo.isConfirm).toEqual(false);
  });

  it('should send an unconfirmed frame to gateway', async () => {
    await rak811.sendUnconfirmedData('01020304');
  });

  it.skip('should send a confirmed frame to gateway', async () => {
    const response = await rak811.sendConfirmedData('010203');

    expect(response.data).toEqual('');
    expect(response.port).toEqual(0);
    expect(response.rssi).toEqual(-128);
    expect(response.snr).toEqual(0);
  });

  it.skip('should send an unconfirmed frame to gateway and receive response', async () => {
    const response = await rak811.sendUnconfirmedDataAndWaitForResponse(
      '03010204',
      { timeout: 30000 }
    );

    expect(response.data).toEqual('');
    expect(response.port).toEqual(0);
    expect(response.rssi).toEqual(-128);
    expect(response.snr).toEqual(0);
  });

  it.skip('should send a confirmed frame to gateway and receive response', async () => {
    const response = await rak811.sendConfirmedDataAndWaitForResponse('202122');

    expect(response.data).toEqual('');
    expect(response.port).toEqual(0);
    expect(response.rssi).toEqual(-128);
    expect(response.snr).toEqual(0);
  });
});

describe('Mock LoRa rak811', () => {
  let rak811: Rak811.LoraRak811;
  let atPort: ATSerialPort;
  const commandRunnerMock = buildCommandRunnerMock();
  const infoData = commandRunnerMock.mockGenerateInfo('RAK811');

  beforeAll(async () => {
    atPort = await commandRunnerMock.buildSerialPort(serialPath);
    rak811 = Rak811.buildRak811(atPort, {
      commandTimeout: 125
    });
  });

  beforeEach(async () => {
    commandRunnerMock.mockClear();
  });

  it('should get its version', async () => {
    commandRunnerMock.mockReadFromSerialPort(
      commandRunnerMock.mockGenerateVersion('RAK811')
    );

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

  it('should get configuration info', async () => {
    commandRunnerMock.mockReadFromSerialPort(infoData);

    const info = await rak811.getInformation();

    expect(info.region).toEqual('EU868');
    expect(info.joinMode).toEqual('OTAA');
    expect(info.devEui).toEqual('AC1F09FFFE04891A');
    expect(info.appEui).toEqual('AC1F09FFF8680811');
    expect(info.appKey).toEqual('AC1F09FFFE04891AAC1F09FFF8680811');
    expect(info.classType).toEqual('A');
    expect(info.isConfirm).toEqual(false);
    expect(info.isJoined).toBe(false);
  });

  it('should get configuration info with AppEui unknown', async () => {
    const fakeData = infoData.slice();
    fakeData[7] = 'AppEui: ';
    commandRunnerMock.mockReadFromSerialPort(fakeData);

    const info = await rak811.getInformation();

    expect(info.region).toEqual('EU868');
    expect(info.joinMode).toEqual('OTAA');
    expect(info.devEui).toEqual('AC1F09FFFE04891A');
    expect(info.appEui).toEqual('unknown');
    expect(info.appKey).toEqual('AC1F09FFFE04891AAC1F09FFF8680811');
    expect(info.classType).toEqual('A');
    expect(info.isJoined).toBe(false);
  });

  it('should set a valid device EUI', async () => {
    const devEui = 'AC1F09FFFE04891A';
    commandRunnerMock.mockReadFromSerialPortOnce(
      commandRunnerMock.mockGenerateValidResponse('RAK811')
    );
    commandRunnerMock.mockReadFromSerialPort(infoData);

    await rak811.setDeviceEui(devEui);
    const info = await rak811.getInformation();
    expect(info.devEui).toEqual(devEui);
  });

  it('should set a invalid device EUI', async () => {
    expect.assertions(3);
    const devEui = 'AC1F09FFFE04891A';
    commandRunnerMock.mockReadFromSerialPortOnce(
      commandRunnerMock.mockGenerateError('RAK811', 2)
    );
    commandRunnerMock.mockReadFromSerialPort(infoData);

    try {
      await rak811.setDeviceEui('invalid');
    } catch (error) {
      if (error instanceof LoraResponseError) {
        expect(error.message).toBe(
          `Lora error code 2: Invalid parameter in the AT command`
        );
        expect(error.getLoraError()).toEqual({
          model: 'RAK811',
          code: 2,
          description: 'Invalid parameter in the AT command'
        });
        const info = await rak811.getInformation();
        expect(info.devEui).toEqual(devEui);
      }
    }
  });

  it('should manage unknown error responses', async () => {
    expect.assertions(1);
    commandRunnerMock.mockReadFromSerialPortOnce(
      commandRunnerMock.mockGenerateError('RAK811', 999)
    );

    try {
      await rak811.setDeviceEui('invalid');
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
      await rak811.setDeviceEui('invalid');
    } catch (error) {
      if (error instanceof Error) {
        expect(error.message).toBe(
          `Timeout error: 1 lines received for command: at+set_config=lora:dev_eui:invalid`
        );
      }
    }
  });

  it('should set a invalid APP EUI', async () => {
    expect.assertions(2);
    const appEui = 'AC1F09FFF8680811';
    commandRunnerMock.mockReadFromSerialPortOnce(
      commandRunnerMock.mockGenerateError('RAK811', 2)
    );
    commandRunnerMock.mockReadFromSerialPort(infoData);

    try {
      await rak811.setAppEui('invalid');
    } catch (error) {
      if (error instanceof LoraResponseError) {
        expect(error.message).toBe(
          `Lora error code 2: Invalid parameter in the AT command`
        );
        const info = await rak811.getInformation();
        expect(info.appEui).toEqual(appEui);
      }
    }
  });

  it('should set a valid APP EUI', async () => {
    const appEui = 'AC1F09FFF8680811';
    commandRunnerMock.mockReadFromSerialPortOnce(
      commandRunnerMock.mockGenerateValidResponse('RAK811')
    );
    commandRunnerMock.mockReadFromSerialPort(infoData);

    await rak811.setAppEui(appEui);
    const info = await rak811.getInformation();
    expect(info.appEui).toEqual(appEui);
  });

  it('should set a invalid App Key', async () => {
    expect.assertions(2);
    const appKey = 'AC1F09FFFE04891AAC1F09FFF8680811';
    commandRunnerMock.mockReadFromSerialPortOnce(
      commandRunnerMock.mockGenerateError('RAK811', 2)
    );
    commandRunnerMock.mockReadFromSerialPort(infoData);

    try {
      await rak811.setAppKey('invalid');
    } catch (error) {
      if (error instanceof LoraResponseError) {
        expect(error.message).toBe(
          `Lora error code 2: Invalid parameter in the AT command`
        );
        const info = await rak811.getInformation();
        expect(info.appKey).toEqual(appKey);
      }
    }
  });

  it('should set a valid APP EUI', async () => {
    commandRunnerMock.mockReadFromSerialPortOnce(
      commandRunnerMock.mockGenerateValidResponse('RAK811')
    );
    commandRunnerMock.mockReadFromSerialPort(infoData);
    const appKey = 'AC1F09FFFE04891AAC1F09FFF8680811';

    await rak811.setAppKey(appKey);

    const info = await rak811.getInformation();
    expect(info.appKey).toEqual(appKey);
  });

  it('should join successfully', async () => {
    commandRunnerMock.mockReadFromSerialPortOnce(infoData);
    commandRunnerMock.mockReadFromSerialPortOnce(
      commandRunnerMock.mockGenerateJoinSuccess('RAK811')
    );

    await rak811.join();
  });

  it('should join twice successfully', async () => {
    commandRunnerMock.mockReadFromSerialPortOnce(infoData);
    commandRunnerMock.mockReadFromSerialPortOnce(
      commandRunnerMock.mockGenerateJoinSuccess('RAK811')
    );
    const joinedState = infoData.slice();
    joinedState[10] = 'Joined Network:true';
    commandRunnerMock.mockReadFromSerialPortOnce(joinedState);

    await rak811.join();
    await rak811.join();
  });

  it('should fail when join fails', async () => {
    expect.assertions(1);
    commandRunnerMock.mockReadFromSerialPortOnce(infoData);
    commandRunnerMock.mockReadFromSerialPortOnce(
      commandRunnerMock.mockGenerateError('RAK811', 99)
    );

    try {
      await rak811.join();
    } catch (error) {
      if (error instanceof LoraResponseError) {
        expect(error.message).toBe(
          `Lora error code 99: Failed to join into a LoRa network`
        );
      }
    }
  });

  it('should change message confirmation', async () => {
    const modifiedInfoData = infoData.slice();
    modifiedInfoData[11] = 'IsConfirm: confirm';
    commandRunnerMock.mockReadFromSerialPortOnce(
      commandRunnerMock.mockGenerateValidResponse('RAK811')
    );
    commandRunnerMock.mockReadFromSerialPortOnce(modifiedInfoData);
    commandRunnerMock.mockReadFromSerialPortOnce(
      commandRunnerMock.mockGenerateValidResponse('RAK811')
    );
    commandRunnerMock.mockReadFromSerialPortOnce(infoData);

    await rak811.setNeedsConfirmation(true);

    const info = await rak811.getInformation();
    expect(info.isConfirm).toEqual(true);

    await rak811.setNeedsConfirmation(false);

    const infoRestored = await rak811.getInformation();
    expect(infoRestored.isConfirm).toEqual(false);
  });

  it('should send an unconfirmed frame to gateway', async () => {
    commandRunnerMock.mockReadFromSerialPortOnce(infoData); // info
    commandRunnerMock.mockReadFromSerialPortOnce(infoData); // join check status
    commandRunnerMock.mockReadFromSerialPortOnce(
      commandRunnerMock.mockGenerateValidResponse('RAK811')
    ); // join
    commandRunnerMock.mockReadFromSerialPortOnce(
      commandRunnerMock.mockGenerateValidResponse('RAK811')
    ); // send data

    await rak811.sendUnconfirmedData('0102030405060708');
  });

  it('should send a confirmed frame to gateway', async () => {
    commandRunnerMock.mockReadFromSerialPortOnce(infoData); // info
    commandRunnerMock.mockReadFromSerialPortOnce(infoData); // join check status
    commandRunnerMock.mockReadFromSerialPortOnce(
      commandRunnerMock.mockGenerateValidResponse('RAK811')
    ); // join
    commandRunnerMock.mockReadFromSerialPortOnce(
      commandRunnerMock.mockGenerateValidResponse('RAK811')
    ); // confirmed
    commandRunnerMock.mockReadFromSerialPortOnce(
      commandRunnerMock.mockGenerateNODataReceived('RAK811')
    );

    const response = await rak811.sendConfirmedData('01020304', {
      timeout: 500
    });

    expect(response.data).toEqual([]);
    expect(response.dataSize).toEqual(0);
    expect(response.port).toEqual(1);
    expect(response.rssi).toEqual(-50);
    expect(response.snr).toEqual(7);
  });

  it('should fails to send a confirmed frame to gateway', async () => {
    expect.assertions(1);
    commandRunnerMock.mockReadFromSerialPortOnce(infoData); // info
    commandRunnerMock.mockReadFromSerialPortOnce(infoData); // join check status
    commandRunnerMock.mockReadFromSerialPortOnce(
      commandRunnerMock.mockGenerateValidResponse('RAK811')
    ); // join
    commandRunnerMock.mockReadFromSerialPortOnce(
      commandRunnerMock.mockGenerateValidResponse('RAK811')
    ); // confirmed
    commandRunnerMock.mockReadFromSerialPortOnce(
      commandRunnerMock.mockGenerateError('RAK811', 96)
    );
    // Response send data [ 'ERROR: 96' ]

    try {
      await rak811.sendConfirmedData('0102030405060708');
    } catch (error) {
      if (error instanceof LoraResponseError) {
        expect(error.message).toBe(
          `Lora error code 96: Time out reached while waiting for a packet in the LoRa RX2 window`
        );
      }
    }
  });

  it('should send an unconfirmed frame to gateway and receive response', async () => {
    commandRunnerMock.mockReadFromSerialPortOnce(infoData); // info
    commandRunnerMock.mockReadFromSerialPortOnce(infoData); // join check status
    commandRunnerMock.mockReadFromSerialPortOnce(
      commandRunnerMock.mockGenerateValidResponse('RAK811')
    ); // join
    commandRunnerMock.mockReadFromSerialPortOnce(
      commandRunnerMock.mockGenerateDataReceived('RAK811', '030405')
    );

    const response = await rak811.sendUnconfirmedDataAndWaitForResponse(
      '0102030405060708'
    );

    expect(response.data).toEqual([0x03, 0x04, 0x05]);
    expect(response.dataSize).toEqual(3);
    expect(response.port).toEqual(1);
    expect(response.rssi).toEqual(-50);
    expect(response.snr).toEqual(7);
  });

  it('should send an confirmed frame to gateway and receive response', async () => {
    commandRunnerMock.mockReadFromSerialPortOnce(infoData); // info
    commandRunnerMock.mockReadFromSerialPortOnce(infoData); // join check status
    commandRunnerMock.mockReadFromSerialPortOnce(
      commandRunnerMock.mockGenerateValidResponse('RAK811')
    ); // join
    commandRunnerMock.mockReadFromSerialPortOnce(
      commandRunnerMock.mockGenerateValidResponse('RAK811')
    ); // confirmed
    commandRunnerMock.mockReadFromSerialPortOnce(
      commandRunnerMock.mockGenerateDataReceived('RAK811', '03040509')
    );

    const response = await rak811.sendConfirmedDataAndWaitForResponse(
      '0102030405060708'
    );

    expect(response.data).toEqual([0x03, 0x04, 0x05, 0x09]);
    expect(response.dataSize).toEqual(4);
    expect(response.port).toEqual(1);
    expect(response.rssi).toEqual(-50);
    expect(response.snr).toEqual(7);
  });
});
