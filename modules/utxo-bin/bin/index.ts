#!/usr/bin/env node
import * as yargs from 'yargs';
import { cmdGenerateAddress, cmdParseAddress, cmdParseScript, cmdParseTx } from '../src/commands';

yargs
  .command(cmdParseTx)
  .command(cmdParseAddress)
  .command(cmdParseScript)
  .command(cmdGenerateAddress)
  .demandCommand()
  .help()
  .parse();
