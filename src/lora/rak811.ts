import { ATSerialPort } from '../serialports';
import { CommandRunnerBuilder, CommandResult } from '../command-runner';
import {
  trimValue,
  validateCommand,
  waitForReceivedValidation
} from './validators';
import { debugLogger, silentLogger } from '../log-service';
import { CommandRunnerDeps } from '../models';

export function buildRak811(
  serialPort: ATSerialPort,
  {
    debug = false,
    logger = debug ? debugLogger : silentLogger,
    runner = CommandRunnerBuilder.buildCommandRunner({
      serialPort,
      debug,
      logger
    }),
    commandTimeout = 3000
  }: CommandRunnerDeps = {}
) {
  async function getVersion() {
    const command = () =>
      runner.executeCommand('at+version', {
        timeout: commandTimeout
      });
    const response = await runner.runCommand(command);
    return response.data[0].split(' ')[1];
  }

  function parseInformation(data: string[]) {
    const region = trimValue(data[1]);
    const joinMode = trimValue(data[5]);
    const devEui = trimValue(data[6]);
    const appEui = trimValue(data[7]);
    const appKey = trimValue(data[8]);
    const classType = trimValue(data[9]);
    const isJoinedValue = trimValue(data[10]);
    const isJoined = isJoinedValue === 'true';
    const isConfirmValue = trimValue(data[11]);
    const isConfirm = isConfirmValue !== 'unconfirm';
    return {
      region,
      joinMode,
      devEui,
      appEui,
      appKey,
      classType,
      isJoined,
      isConfirm
    };
  }
  async function runInformationCommand() {
    return runner.executeCommand('at+get_config=lora:status', {
      validation: data => data.length === 25,
      timeout: commandTimeout
    });
  }
  async function getInformation() {
    const response = await runner.runCommand(runInformationCommand);
    return parseInformation(response.data);
  }

  async function runSetDeviceEui(devEui: string) {
    return runner.executeCommand(`at+set_config=lora:dev_eui:${devEui}`, {
      timeout: commandTimeout,
      validation: validateCommand
    });
  }
  async function setDeviceEui(devEui: string) {
    await runner.runCommand(() => runSetDeviceEui(devEui));
  }

  async function runSetAppEui(appEui: string) {
    return runner.executeCommand(`at+set_config=lora:app_eui:${appEui}`, {
      timeout: commandTimeout,
      validation: validateCommand
    });
  }
  async function setAppEui(appEui: string) {
    await runner.runCommand(() => runSetAppEui(appEui));
  }

  async function runSetAppKey(appKey: string) {
    return runner.executeCommand(`at+set_config=lora:app_key:${appKey}`, {
      timeout: commandTimeout,
      validation: validateCommand
    });
  }
  async function setAppKey(appKey: string) {
    await runner.runCommand(() => runSetAppKey(appKey));
  }

  async function runJoinCommand(timeout: number): Promise<CommandResult> {
    const infoResponse = await runInformationCommand();
    const info = parseInformation(infoResponse.data);
    if (info.isJoined) {
      return {
        data: ['Ok Join Success'],
        command: 'at+join'
      };
    }
    return runner.executeCommand('at+join', {
      timeout,
      validation: validateCommand
    });
  }
  async function join({ timeout = 10000 } = {}) {
    await runner.runCommand(() => runJoinCommand(timeout));
  }

  async function runConfirmCommand(confirmation: boolean) {
    return runner.executeCommand(
      `at+set_config=lora:confirm:${confirmation ? 1 : 0}`,
      {
        validation: validateCommand
      }
    );
  }
  async function setNeedsConfirmation(confirmation: boolean) {
    await runner.runCommand(() => runConfirmCommand(confirmation));
  }

  async function runSendData(
    data: string,
    validation: (data: string[]) => boolean,
    timeout: number
  ) {
    return await runner.executeCommand(`at+send=lora:2:${data}`, {
      timeout,
      validation
    });
  }

  async function sendData(
    data: string,
    {
      confirmed = false,
      timeout,
      validation = validateCommand
    }: {
      confirmed?: boolean;
      validation?: (data: string[]) => boolean;
      timeout: number;
    }
  ) {
    return await runner.runCommand(async () => {
      const infoResponse = await runInformationCommand();
      const info = parseInformation(infoResponse.data);
      if (!info.isJoined) {
        await runJoinCommand(10000);
      }
      if (info.isConfirm !== confirmed) {
        await runConfirmCommand(confirmed);
      }
      return await runSendData(data, validation, timeout);
    });
  }

  async function sendUnconfirmedData(data: string, { timeout = 10000 } = {}) {
    await sendData(data, { timeout });
  }

  function extractDataReceived(response: string | undefined) {
    if (!response) return [];
    const hexResponse = [];
    for (let i = 0; i < response.length; i += 2) {
      hexResponse.push(parseInt(`${response[i]}${response[i + 1]}`, 16));
    }
    return hexResponse;
  }
  function parseDataReceived(data: string) {
    const [, message] = data.split('=');
    const [status, response] = message.split(':');
    const [port, rssi, snr, dataSize] = status.split(',');
    const hexResponse = extractDataReceived(response);
    return {
      status: parseInt(status),
      port: parseInt(port),
      rssi: parseInt(rssi),
      snr: parseInt(snr),
      dataSize: parseInt(dataSize),
      data: hexResponse
    };
  }
  async function sendDataAndWaitResponse(
    data: string,
    { timeout, confirmed = false }: { timeout: number; confirmed?: boolean }
  ) {
    const response = await sendData(data, {
      confirmed,
      timeout,
      validation: waitForReceivedValidation
    });
    return parseDataReceived(response.data[1]);
  }

  async function sendConfirmedData(data: string, { timeout = 6000 } = {}) {
    return sendDataAndWaitResponse(data, {
      timeout,
      confirmed: true
    });
  }

  async function sendUnconfirmedDataAndWaitForResponse(
    data: string,
    { timeout = 6000 } = {}
  ) {
    return sendDataAndWaitResponse(data, { timeout });
  }

  async function sendConfirmedDataAndWaitForResponse(
    data: string,
    { timeout = 10000 } = {}
  ) {
    return sendDataAndWaitResponse(data, {
      timeout,
      confirmed: true
    });
  }

  return {
    getVersion,
    getInformation,
    setDeviceEui,
    setAppEui,
    setAppKey,
    join,
    setNeedsConfirmation,
    sendUnconfirmedData,
    sendConfirmedData,
    sendUnconfirmedDataAndWaitForResponse,
    sendConfirmedDataAndWaitForResponse
  };
}

export type LoraRak811 = ReturnType<typeof buildRak811>;
