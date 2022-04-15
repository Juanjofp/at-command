import { Transform } from 'stream';

export type SerialPortInfo = {
    path: string;
    vendorId?: string;
    manufacturer?: string;
    serialNumber: string;
    productId?: string;
};

export type Encodings =
    | 'ascii'
    | 'utf8'
    | 'utf16le'
    | 'ucs2'
    | 'base64'
    | 'binary'
    | 'hex';

export type WriteValues = string | Buffer | Array<number>;

export type WritableRunner = {
    write: (data: WriteValues, encoding?: Encodings) => Promise<number>;
};

export type SerialPortOptions = {
    baudRate?: number;
};

export type ATSerialPort = {
    open(): Promise<void>;
    isOpen(): boolean;
    write: WritableRunner['write'];
    read(): Transform;
    // on(event: 'error', listener: (err: Error) => void): ATSerialPort;
    close(): Promise<void>;
};

export class RunCommandTimeoutError extends Error {
    constructor(readonly command: string, readonly dataReceived: string) {
        super(
            `Timeout error: ${dataReceived.length} bytes received for command: ${command}`
        );
        this.name = 'RunCommandError';
    }
}
