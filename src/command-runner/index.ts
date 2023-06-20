import {
  buildCommandRunner,
  CommandRunner as CommandRunnerType,
  ExecutorCommand as ExecutorCommandType
} from './runner';

export const CommandRunnerBuilder = {
  buildCommandRunner
};
export type CommandRunnerBuilder = typeof CommandRunnerBuilder;
export type CommandRunner = CommandRunnerType;
export type ExecutorCommand = ExecutorCommandType;
export * from './models';
