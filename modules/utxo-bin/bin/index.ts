#!/usr/bin/env node
import * as yargs from 'yargs';
import { cmdGenerateAddress, cmdParseAddress, cmdParseScript, cmdParseTx, cmdParseXpub } from '../src/commands';

yargs
  .command(cmdParseTx)
  .command(cmdParseAddress)
  .command(cmdParseScript)
  .command(cmdGenerateAddress)
  .command(cmdParseXpub)
  .demandCommand()
  .help()
  .parse();
