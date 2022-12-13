#!/usr/bin/env node
import * as yargs from 'yargs';
import { cmdGenerateAddress, cmdGenerateXpubs, cmdParseAddress, cmdParseTx } from '../src/commands';

yargs
  .command(cmdParseTx)
  .command(cmdParseAddress)
  .command(cmdGenerateXpubs)
  .command(cmdGenerateAddress)
  .demandCommand()
  .help()
  .parse();
