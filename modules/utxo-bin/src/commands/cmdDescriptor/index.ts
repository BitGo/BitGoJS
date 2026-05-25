import { CommandModule } from 'yargs';
import { cmdFromFixedScript } from './fromFixedScript';

export * from './fromFixedScript';

export const cmdDescriptor: CommandModule<unknown, unknown> = {
  command: 'descriptor <command>',
  describe: 'descriptor commands',
  builder(b) {
    return b.strict().command(cmdFromFixedScript).demandCommand();
  },
  handler() {
    // do nothing
  },
};
