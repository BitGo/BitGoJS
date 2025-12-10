import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { cmdCreate, cmdRegisterFullnode, cmdShow, cmdXprv } from './commands/createWallet';
import { cmdAddress } from './commands/createAddress';
import { cmdTx } from './commands/tx/transaction';
import { cmdUnspents } from './commands/unspents';
import { cmdStaking } from './commands/staking';

yargs(hideBin(process.argv))
  .option('env', { choices: ['prod', 'test', 'staging'], default: 'staging' } as const)
  .option('coin', { type: 'string', default: 'tbtc' })
  .option('accessToken', { type: 'string' })
  .option('walletPassphrase', { type: 'string', default: 'setec astronomy' })
  .strict()
  .command(cmdStaking)
  .command(cmdCreate)
  .command(cmdRegisterFullnode)
  .command(cmdXprv)
  .command(cmdShow)
  .command(cmdAddress)
  .command(cmdTx)
  .command(cmdUnspents)
  .demandCommand()
  .help().argv;
