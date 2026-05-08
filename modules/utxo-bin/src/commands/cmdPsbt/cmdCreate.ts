import * as yargs from 'yargs';
import { withPsbt, withPsbtOptions, WithPsbtOptions } from './withPsbt';

type ArgsCreatePsbt = WithPsbtOptions & {
  txVersion?: number;
  txLocktime?: number;
};

export const cmdCreate: yargs.CommandModule<unknown, ArgsCreatePsbt> = {
  builder(b: yargs.Argv<unknown>) {
    return b.options(withPsbtOptions).option('txVersion', { type: 'number' }).option('txLocktime', { type: 'number' });
  },
  command: 'create',
  describe: 'create empty psbt without inputs or outputs',
  async handler(argv) {
    return withPsbt({ ...argv, create: true, expectEmpty: true }, async function (psbt) {
      if (argv.txVersion !== undefined) {
        psbt.setVersion(argv.txVersion);
      }
      if (argv.txLocktime !== undefined) {
        psbt.setLocktime(argv.txLocktime);
      }
      return psbt;
    });
  },
};
