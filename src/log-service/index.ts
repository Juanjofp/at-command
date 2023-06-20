export const debugLogger = {
  info: (...args: string[]) => {
    console.log('<Info>', ...args);
  },
  error: (...args: string[]) => {
    console.log('<Error>', ...args);
  }
};

export type Logger = typeof debugLogger;

export const silentLogger: Logger = {
  info: () => undefined,
  error: () => undefined
};
