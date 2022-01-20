#!/usr/bin/env node
import * as yargs from 'yargs';
import { cmdParse } from '../src/commands';
yargs.command(cmdParse).help().parse();
