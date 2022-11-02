#!/usr/bin/env node
import * as yargs from 'yargs';
import { cmdParseAddress, cmdParseTx } from '../src/commands';
yargs.command(cmdParseTx).command(cmdParseAddress).help().parse();
