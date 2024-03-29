import { Logger } from '../log-service';

export class RunCommandTimeoutError extends Error {
  constructor(readonly command: string, readonly dataReceived: string[]) {
    super(
      `Timeout error: ${dataReceived.length} lines received for command: ${command}`
    );
    this.name = 'RunCommandError';
  }
}

export type ValidationPredicate = (result: string[]) => boolean;
export type ExecutionOptions = {
  validation?: ValidationPredicate;
  timeout?: number;
  debug?: boolean;
  logger?: Logger;
};
export type CommandResult = {
  command: string;
  data: string[];
};
