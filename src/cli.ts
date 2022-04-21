#!/usr/bin/env node
import { CommandRunnerBuilder, Rak811 } from '.';

const commands: Record<
    string,
    (portName: string, ...args: string[]) => unknown
> = {
    async list() {
        const ports = await CommandRunnerBuilder.getSerialPortList();
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

    async version(portName) {
        requirePortName(portName, 'version');
        const rak811 = await initRAk811(portName);
        const version = await rak811.getVersion();
        return `Lora RAk811 version ${version}`;
    },

    async status(portName) {
        requirePortName(portName, 'status');
        const rak811 = await initRAk811(portName);
        const information = await rak811.getInformation();
        const outputKeys = Object.keys(
            information
        ) as (keyof typeof information)[];
        const output = outputKeys.map(key => `${key}: ${information[key]}`);
        return `Lora RAk811 status:\n${output.join('\n')}`;
    },

    async send(portName, ...params: string[]) {
        requirePortName(portName, 'version');
        const rak811 = await initRAk811(portName);
        const [payload] = params;
        await rak811.sendUnconfirmedData(payload);
        return `Lora RAk811 sent:\n${payload}`;
    }
};

function requirePortName(portName: string, command = 'this command') {
    if (!portName) {
        throw new Error(`Port name is required for ${command}`);
    }
}

async function initRAk811(portName: string) {
    const port = await CommandRunnerBuilder.buildSerialPort(portName);
    return Rak811.buildRak811(port);
}

function printMenu() {
    console.log('\n\n------------ MENU ----------------------');
    console.log('Commands:');
    console.log('  list');
    console.log('  version <portName>');
    console.log('  status <portName>');
    console.log('  send <portName> <hexData>');
    console.log('\n----------------------------------------');
    console.log('  Sample: c511c3-cli /dev/ttyS0 version');
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
    const [command, portName, ...params] = args;
    if (!command || !commands[command]) {
        throw new Error(`Invalid command: ${command}`);
    }
    return {
        command,
        portName,
        params
    };
}
async function main() {
    try {
        const { command, portName, params } = extractArguments();
        const commandFn = commands[command];
        if (typeof commandFn === 'function') {
            const response = await commandFn(portName, ...params);
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

main();
