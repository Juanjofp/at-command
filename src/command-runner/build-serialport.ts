import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import {
    ATSerialPort,
    Encodings,
    SerialPortOptions,
    WriteValues
} from './models';

function buildATSerialPort(port: SerialPort): ATSerialPort {
    const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

    function write(data: WriteValues, encoding?: Encodings): Promise<number> {
        return new Promise((resolve, reject) => {
            if (!port.isOpen)
                return void reject(
                    new Error(`Cannot write in a closed serialport`)
                );
            port.flush(function bufferCleaned(errorInflush) {
                if (errorInflush)
                    return void reject(
                        new Error(
                            `Flush Error for ${data}: Error ${errorInflush}`
                        )
                    );
                port.write(data, encoding, errorInWrite => {
                    if (errorInWrite)
                        return void reject(
                            new Error(
                                `Write Error for ${data}: Error ${errorInWrite}`
                            )
                        );
                    port.drain(function clearBuffer(errorInDrain) {
                        if (errorInDrain)
                            return void reject(
                                new Error(
                                    `Drain Error for ${data}: Error ${errorInDrain}`
                                )
                            );
                        resolve(data.length);
                    });
                });
            });
        });
    }

    async function open(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (port.isOpen) return void resolve(undefined);

            port.open(error => {
                if (error)
                    return void reject(
                        new Error(`Error opening serialport: ${error}`)
                    );
                return void resolve(undefined);
            });
        });
    }

    async function close(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!port.isOpen) return void resolve(undefined);
            port.close(error => {
                if (error)
                    return void reject(
                        new Error(`Error closing serialport: ${error}`)
                    );
                return void resolve(undefined);
            });
        });
    }

    return {
        open,
        isOpen: () => port.isOpen,
        write,
        read: () => parser,
        close
    };
}
export async function buildSerialPort(
    path: string,
    options: SerialPortOptions = {}
): Promise<ATSerialPort> {
    return new Promise((resolve, reject) => {
        const serialPort = new SerialPort({
            path,
            ...options,
            baudRate: options.baudRate || 119200,
            autoOpen: false
        });

        serialPort.open(err => {
            if (err) {
                return void reject(new Error(err.message));
            }
            serialPort.close(err => {
                if (err) {
                    return void reject(new Error(err.message));
                }
                return void resolve(buildATSerialPort(serialPort));
            });
        });
    });
}
