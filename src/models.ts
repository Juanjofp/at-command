import { Logger } from './log-service';
import { CommandRunner } from './command-runner';

export type CommandRunnerDeps = {
  debug?: boolean;
  logger?: Logger;
  runner?: CommandRunner;
  commandTimeout?: number;
};
