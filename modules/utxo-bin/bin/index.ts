#!/usr/bin/env node
import * as yargs from 'yargs';

import { cmdParseTx, cmdParseScript, cmdBip32, cmdAddress } from '../src/commands';

yargs
  .command(cmdParseTx)
  .command(cmdAddress)
  .command(cmdParseScript)
  .command(cmdBip32)
  .strict()
  .demandCommand()
  .help()
  .parse();
