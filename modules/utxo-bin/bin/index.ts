#!/usr/bin/env node
import * as yargs from 'yargs';
import { cmdParseAddress, cmdParseTx } from '../src/commands';
import { cmdCheckLocktime, cmdFetchTxs } from '../src/checkLocktime';
yargs.command(cmdParseTx).command(cmdParseAddress).command(cmdFetchTxs).command(cmdCheckLocktime).help().parse();
