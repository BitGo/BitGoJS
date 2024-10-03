#!/usr/bin/env node
import * as yargs from 'yargs';

import { cmdParseTx, cmdParseScript, cmdBip32, cmdGenerateAddress, cmdParseAddress } from '../src/commands';

yargs
  .command(cmdParseTx)
  .command(cmdParseAddress)
  .command(cmdParseScript)
  .command(cmdGenerateAddress)
  .command(cmdBip32)
  .strict()
  .demandCommand()
  .help()
  .parse();
