#!/usr/bin/env node
import * as yargs from 'yargs';
import { cmdParseAddress, cmdParseScript, cmdParseTx } from '../src/commands';

yargs.command(cmdParseTx).command(cmdParseAddress).command(cmdParseScript).demandCommand().help().parse();
