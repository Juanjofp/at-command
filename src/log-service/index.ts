export const defaultLogger = {
    info: (...args: string[]) => {
        console.log('<Info>', ...args);
    },
    error: (...args: string[]) => {
        console.log('<Error>', ...args);
    }
};

export type Logger = typeof defaultLogger;

export const silentLogger: Logger = {
    info: () => undefined,
    error: () => undefined
};
