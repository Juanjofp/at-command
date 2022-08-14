#!/usr/bin/env node
import { ATSerialPortBuilder, Rak811, TD1208, Rak11300, ERIC } from '.';

const commands: Record<
    string,
    (portName: string, ...args: string[]) => unknown
> = {
    async list() {
        const ports = await ATSerialPortBuilder.getSerialPortList();
        const output = ports
            .map(
                (port, index) =>
                    `${index} -> ${port.manufacturer || 'Unknown'}: ${
                        port.path
                    }`
            )
            .join('\n');
        return `Listing ports:\n${output}`;
    },

    async version(model, portName) {
        requirePortName(portName, 'version');
        const device = await initDevice(model, portName);
        const version = await device.getVersion();
        return `Lora RAk811 version ${version}`;
    },

    async status(model, portName) {
        requirePortName(portName, 'status');
        const device = await initDevice(model, portName);
        const information = await device.getInformation();
        const outputKeys = Object.keys(
            information
        ) as (keyof typeof information)[];
        const output = outputKeys.map(key => `${key}: ${information[key]}`);
        return `Device ${model} status:\n${output.join('\n')}`;
    },

    async send(model, portName, ...params: string[]) {
        requirePortName(portName, 'version');
        const device = await initDevice(model, portName);
        const [payload] = params;
        await sendData(device, payload);
        return `Device ${model} sent: ${payload}`;
    },

    async sendWait(model, portName, ...params: string[]) {
        requirePortName(portName, 'version');
        const device = await initDevice(model, portName);
        const [payload] = params;
        const response = await sendDataAndWait(device, payload);
        return `Device ${model} received:\n${response}`;
    }
};

function requirePortName(portName: string, command = 'this command') {
    if (!portName) {
        throw new Error(`Port name is required for ${command}`);
    }
}

async function sendDataAndWait(
    device: TD1208.SigfoxTD1208 | Rak811.LoraRak811 | Rak11300.LoraRak11300,
    payload: string
) {
    if ('sendUnconfirmedDataAndWaitForResponse' in device) {
        return await device.sendUnconfirmedDataAndWaitForResponse(payload, {
            timeout: 20000
        });
    } else {
        return await device.sendDataAndWaitForResponse(payload, {
            timeout: 40000
        });
    }
}

async function sendData(
    device: TD1208.SigfoxTD1208 | Rak811.LoraRak811 | Rak11300.LoraRak11300,
    payload: string
) {
    if ('sendUnconfirmedData' in device) {
        await device.sendUnconfirmedData(payload, { timeout: 20000 });
    } else {
        await device.sendData(payload, { timeout: 40000 });
    }
}
async function initDevice(device: string, portName: string) {
    if (device.toLowerCase() === 'rak811') {
        return initRAk811(portName);
    }
    if (device.toLowerCase() === 'rak11300') {
        return initRAK11300(portName);
    }
    if (device.toLowerCase() === 'eric') {
        return initERIC(portName);
    }
    return initTD1208(portName);
}

async function initRAk811(portName: string) {
    const port = await ATSerialPortBuilder.buildSerialPort(portName);
    return Rak811.buildRak811(port);
}

async function initRAK11300(portName: string) {
    const port = await ATSerialPortBuilder.buildSerialPort(portName);
    return Rak11300.buildRak11300(port);
}

async function initTD1208(portName: string) {
    const port = await ATSerialPortBuilder.buildSerialPort(portName, {
        baudRate: 9600
    });
    return TD1208.buildTD1208(port);
}

async function initERIC(portName: string) {
    const port = await ATSerialPortBuilder.buildSerialPort(portName, {
        baudRate: 9600
    });
    return ERIC.buildEric(port);
}

function printMenu() {
    console.log('\n\n------------ MENU ----------------------');
    console.log('Commands:');
    console.log('  list');
    console.log('  version <RAK811|TD1208|RAK11300|ERIC> <portName>');
    console.log('  status <RAK811|TD1208|RAK11300|ERIC> <portName>');
    console.log('  send <RAK811|TD1208|RAK11300|ERIC> <portName> <hexData>');
    console.log(
        '  sendWait <RAK811|TD1208|RAK11300|ERIC> <portName> <hexData>'
    );
    console.log('\n----------------------------------------');
    console.log(
        '  Sample: @juanjofp/at-command-cli version rak811 /dev/ttyUSB0'
    );
    console.log('----------------------------------------\n\n');
}
function printMessage(message: unknown) {
    printMenu();
    console.log(`\n${message}\n\n`);
}
function printError(error: Error) {
    printMenu();
    console.error(`ERROR: ${error.message}\n\n`);
}
function extractArguments() {
    const args = process.argv.slice(2);
    const [command, model, portName, ...params] = args;
    if (!command || !commands[command]) {
        throw new Error(`Invalid command: ${command}`);
    }
    return {
        command,
        model,
        portName,
        params
    };
}
async function main() {
    try {
        const { command, model, portName, params } = extractArguments();
        const commandFn = commands[command];
        if (typeof commandFn === 'function') {
            const response = await commandFn(model, portName, ...params);
            printMessage(response);
        } else {
            printError(new Error(`Invalid command: ${command}`));
        }
    } catch (error) {
        if (error instanceof Error) {
            printError(error);
        } else {
            printError(new Error(`Unknown error: ${error}`));
        }
    }
}

main().catch(printError);
