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
