import { ATSerialPort } from '../serialports';
import { CommandRunnerBuilder } from '../command-runner';
import { debugLogger, silentLogger } from '../log-service';
import { CommandRunnerDeps } from '../models';

export function buildSIM800C(
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
    const defaultCommandParams = {
      timeout: commandTimeout,

      validation: (result: string[]) => {
        console.log('Data to parse', result);

        if (result.some(line => line.toLowerCase().startsWith('error'))) {
          return true;
        }

        return result.some(line => line.toLowerCase().startsWith('ok'));
      }
    };

    const pin = async () =>
      await runner.executeCommand('AT+CPIN?', defaultCommandParams);

    const reg = async () =>
      await runner.executeCommand('AT+CGREG=1', defaultCommandParams);

    const regCheck = async () =>
      await runner.executeCommand('AT+CGREG?', defaultCommandParams);

    const cops = async () =>
      await runner.executeCommand('AT+COPS?', defaultCommandParams);

    const signal = async () =>
      await runner.executeCommand('AT+CSQ', defaultCommandParams);

    // const apn = async () =>
    //   await runner.executeCommand(
    //     'AT+CGDCONT=1,"IP","orangeworld"',
    //     defaultCommandParams
    //   );

    const apnCheck = async () =>
      await runner.executeCommand('AT+CGDCONT?', defaultCommandParams);

    const attach = async () =>
      await runner.executeCommand('AT+CGATT=1', defaultCommandParams);

    const attachCheck = async () =>
      await runner.executeCommand('AT+CGATT?', defaultCommandParams);

    // const pdpContext = async () =>
    //   await runner.executeCommand('AT+CGACT=1,1', defaultCommandParams);

    const ipCheck = async () =>
      await runner.executeCommand('AT+CGPADDR=1', defaultCommandParams);

    const ping = async () =>
      await runner.executeCommand(
        'AT+CIPPING="142.250.200.142"',
        defaultCommandParams
      );

    return await runner.runCommands([
      pin,
      reg,
      regCheck,
      cops,
      signal,
      // apn,
      apnCheck,
      attach,
      attachCheck,
      // pdpContext,
      ipCheck,
      attachCheck,
      ping
    ]);
  }

  return {
    getVersion
  };
}

// ~~~~~~ Type

export type SIM800C = ReturnType<typeof buildSIM800C>;

// AT+CPIN? => Ready
// AT+CGREG? => 0,1
// AT+CGREG=1 + force to attach
// AT+COPS?
// AT+CSQ
// AT+CGDCONT=1,”IP”,”epc.tmobile.com”
// AT+CGACT=1,1
// AT+CGPADDR=1
