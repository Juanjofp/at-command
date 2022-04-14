import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';

console.log('Hello LoRa!');
const serialLora = '/dev/tty.usbmodem214301';

// port.write('mac get appeui\r\n', function (err) {
//     if (err) {
//         return console.log('Error on write: ', err.message);
//     }
//     console.log('message written mac get status');
// });

// port.write('sys get ver\r\n', function (err) {
//     if (err) {
//         return console.log('Error on write: ', err.message);
//     }
//     console.log('message written');
// });

// // Read data that is available but keep the stream in "paused mode"
// port.on('readable', function () {
//     console.log('Data Readable:', port.read());
// });

// // Switches the port into "flowing mode"
// port.on('data', function (data) {
//     console.log('Data Raw:', data.toString());
// });

async function runCommand(
    cmd: string,
    port: SerialPort,
    parser: any,
    validation = 'ok'
) {
    return new Promise((resolve, reject) => {
        let lastData = '';
        function parserListener(data: string) {
            console.log('Response cmd parsed:', data);
            lastData = data;
            if (data.toLowerCase().startsWith(validation)) {
                resolve(data);
                parser.removeListener('data', parserListener);
                return;
            }
        }
        parser.on('data', parserListener);
        port.write(cmd + '\r\n', function (err) {
            if (err) {
                console.log('Error on write: ', err.message);
                return void reject(err);
            }
            console.log('Command sent:', cmd);
        });
        setTimeout(() => {
            reject(new Error(`Last data received: ${lastData}`));
            parser.removeListener('data', parserListener);
        }, 5000);
    });
}

// function repeatCommand(port: SerialPort, parser: any) {
//     setTimeout(async () => {
//         const response = await runCommand(
//             'mac tx cnf 1 01020305060708',
//             port,
//             parser,
//             'mac_tx_ok'
//         );
//         console.log('response at:', new Date().toISOString(), response);
//         repeatCommand(port, parser);
//     }, 1 * 60 * 1000);
// }
// async function main() {
//     const port = new SerialPort({ path: serialLora, baudRate: 9600 }, err =>
//         console.log('Serial port opened', err)
//     );
//     const parser = port.pipe(new Readline({ delimiter: '\r\n' }));
//
//     parser.on('data', function (data: string) {
//         console.log('Global Data:', data);
//     });
//
//     // Open errors will be emitted as an error event
//     port.on('error', function (err) {
//         console.log('Error: ', err.message);
//     });
//
//     setInterval(async () => {
//         const res0 = await runCommand('mac set devaddr 260BF4F2', port, parser);
//         console.log('devaddr', res0);
//         const res = await runCommand(
//             'mac set appeui 0000000000000000',
//             port,
//             parser
//         );
//         console.log('appeui', res);
//         const res2 = await runCommand(
//             'mac set deveui 70B3D57ED004BA62',
//             port,
//             parser
//         );
//         console.log('deveui', res2);
//         const res3 = await runCommand(
//             'mac set appkey B9F04960698AA05A6A36FF05819536E9',
//             port,
//             parser
//         );
//         console.log('appkey', res3);
//         const res4 = await runCommand('mac save', port, parser);
//         console.log('save', res4);
//         const res5 = await runCommand(
//             'mac join otaa',
//             port,
//             parser,
//             'accepted'
//         );
//         console.log('join otaa', res5);
//         // repeatCommand(port, parser);
//         const response = await runCommand(
//             'mac tx cnf 1 01020305060708',
//             port,
//             parser,
//             'mac_tx_ok'
//         );
//         console.log('response at:', new Date().toISOString(), response);
//     }, 3000);
// }

export async function runATCommands() {
    const port = new SerialPort({ path: serialLora, baudRate: 115200 }, err =>
        console.log('Serial port opened', err)
    );
    const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

    parser.on('data', function (data: string) {
        console.log('Global Data:', data);
    });

    // Open errors will be emitted as an error event
    port.on('error', function (err) {
        console.log('Error: ', err.message);
    });

    const res0 = await runCommand('at+version', port, parser);
    console.log('Command Result at+version', res0);
    port.close();
}
