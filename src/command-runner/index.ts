import {
    buildCommandRunner,
    CommandRunner as CommandRunnerType
} from './runner';

export const CommandRunnerBuilder = {
    buildCommandRunner
};
export type CommandRunnerBuilder = typeof CommandRunnerBuilder;
export type CommandRunner = CommandRunnerType;
export * from './models';
