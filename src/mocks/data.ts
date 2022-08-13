export const infoDataRAK811 = [
    'OK Work Mode: LoRaWAN',
    'Region: EU868',
    'MulticastEnable: false',
    'DutycycleEnable: false',
    'Send_repeat_cnt: 0',
    'Join_mode: OTAA',
    'DevEui: AC1F09FFFE04891A',
    'AppEui: AC1F09FFF8680811',
    'AppKey: AC1F09FFFE04891AAC1F09FFF8680811',
    'Class: A',
    'Joined Network:false',
    'IsConfirm: unconfirm',
    'AdrEnable: true',
    'EnableRepeaterSupport: false',
    'RX2_CHANNEL_FREQUENCY: 869525000, RX2_CHANNEL_DR:0',
    'RX_WINDOW_DURATION: 3000ms',
    'RECEIVE_DELAY_1: 1000ms',
    'RECEIVE_DELAY_2: 2000ms',
    'JOIN_ACCEPT_DELAY_1: 5000ms',
    'JOIN_ACCEPT_DELAY_2: 6000ms',
    'Current Datarate: 5',
    'Primeval Datarate: 5',
    'ChannelsTxPower: 0',
    'UpLinkCounter: 0',
    'DownLinkCounter: 0'
];

export const versionRAK811 = ['OK V3.0.0.14.H'];

export const validResponseRAK811 = ['OK'];

export const errorResponseRAK811 = (errorNumber: number) => [
    `Error: ${errorNumber}`
];

export const validJOINRAK811 = ['OK Join Success'];

export const receivedDataRAK811 = (data = '030405') => [
    'OK ',
    `at+recv=1,-50,7,${data.length / 2}:${data}`
];
export const receivedNODataRAK811 = ['OK ', `at+recv=1,-50,7,0`];

export const versionTD1208 = ['ati5', 'M10+2015', 'OK'];

export const infoDataTD1208 = [
    'AT&V\r',
    'Telecom Design TD1207',
    'Hardware Version: 0F',
    'Software Version: SOFT2068',
    'S/N: 0020451D',
    'TDID: 140558105258',
    'ACTIVE PROFILE',
    'E1 V1 Q0 X1 S200:0 S300:24 S301:2 S403:869700000 S404:14 S405:-95',
    'OK'
];

export const errorResponseTD1208 = ['AT$SF=010203', 'ERROR'];
export const validResponseTD1208 = ['AT$SF=010203', 'OK'];
export const receivedDataTD1208 = (data = '030405') => [
    'AT$SF=010203040506070809101112,2,1\r',
    'OK',
    '+RX BEGIN',
    '+RX=' + data,
    '+RX END'
];
export const receivedNODataTD1208 = [
    'AT$SF=010203040506070809101112,2,1\r',
    'OK',
    '+RX BEGIN',
    '+RX END'
];

export const versionRAK11300 = [
    'AT+VER=?\r',
    '+VER:1.0.0 Apr 21 2022 16:04:06',
    'OK'
];
export const infoDataRAK11300 = [
    'AT+STATUS=?\rDevice status:\n' +
        '   Auto join enabled\n' +
        '   Mode LPWAN\n' +
        'LPWAN status:\n' +
        '   Marks: AA 55\n' +
        '   Dev EUI E660CCC14B738A30\n' +
        '   App EUI 308A734BC1CC60E6\n' +
        '   App Key E660CCC14B738A30308A734BC1CC60E6\n' +
        '   Dev Addr 4634BEBA\n' +
        '   NWS Key E660CCC14B738A30308A734BC1CC60E6\n' +
        '   Apps Key E660CCC14B738A30308A734BC1CC60E6\n' +
        '   OTAA enabled\n' +
        '   ADR enabled\n' +
        '   Public Network\n' +
        '   Dutycycle disabled\n' +
        '   Repeat time 0\n' +
        '   Join trials 10\n' +
        '   TX Power 0\n' +
        '   DR 3\n' +
        '   Class 0\n' +
        '   Subband 1\n' +
        '   Fport 2\n' +
        '   Unconfirmed Message\n' +
        '   Region EU868\n' +
        '   Network not joined\n' +
        'LoRa P2P status:\n' +
        '   P2P frequency 916000000\n' +
        '   P2P TX Power 22\n' +
        '   P2P BW 125\n' +
        '   P2P SF 7\n' +
        '   P2P CR 1\n' +
        '   P2P Preamble length 8\n' +
        '   P2P Symbol Timeout 0\n',
    '+STATUS: ',
    'OK'
];
export const validResponseRAK11300 = ['AT+CMD=SUCCESS', 'OK'];
export const errorResponseRAK11300 = (errorNumber: number) => [
    `+CME ERROR:${errorNumber}`
];

export const versionERIC = ['1', '1', '0'];
export const infoDataERIC = [
    'AX-Sigfox 1.1.0-ETSI',
    '00C16E3F',
    '5A5C706778434E31',
    '0868130000'
];
export const errorResponseERIC = (error: string) => [error];
export const validResponseERIC = ['OK'];
export const receivedDataERIC = (data = '030405') => [
    'AT$SF=010203040506070809101112,2,1\r',
    'OK',
    '+RX BEGIN',
    '+RX=' + data,
    '+RX END'
];
export const receivedNODataERIC = [
    'AT$SF=010203040506070809101112,2,1\r',
    'OK',
    '+RX BEGIN',
    '+RX END'
];
