#!/usr/bin/env node

// Suppress noisy SDK warnings before any imports
const originalStdoutWrite = process.stdout.write.bind(process.stdout);
const originalStderrWrite = process.stderr.write.bind(process.stderr);

const suppressedPatterns = [
  /@polkadot\/util.*has multiple versions/,
  /Either remove and explicitly install matching versions/,
  /The following conflicting packages were found/,
  /cjs \d+\.\d+\.\d+\s+node_modules\/@polkadot/,
];

function shouldSuppress(message: string): boolean {
  return suppressedPatterns.some(pattern => pattern.test(message));
}

process.stdout.write = function(chunk: any, ...args: any[]): boolean {
  const message = chunk.toString();
  if (shouldSuppress(message)) {
    return true;
  }
  return originalStdoutWrite(chunk, ...args);
} as any;

process.stderr.write = function(chunk: any, ...args: any[]): boolean {
  const message = chunk.toString();
  if (shouldSuppress(message)) {
    return true;
  }
  return originalStderrWrite(chunk, ...args);
} as any;

import * as yargs from 'yargs';
import {
  balanceCommand,
  addressCommand,
  sendCommand,
  transfersCommand,
  walletCommand,
  lightningCommand,
} from '../src/commands';

yargs
  .scriptName('sdk-dev-cli')
  .usage('$0 <command> [options]')
  .command(balanceCommand)
  .command(addressCommand)
  .command(sendCommand)
  .command(transfersCommand)
  .command(walletCommand)
  .command(lightningCommand)
  .example('$0 balance', 'Get wallet balance')
  .example('$0 address create', 'Create a new address')
  .example('$0 send --to <address> --amount <amount> --confirm', 'Send a transaction')
  .demandCommand(1, 'You must specify a command')
  .help()
  .alias('help', 'h')
  .version()
  .alias('version', 'v')
  .wrap(yargs.terminalWidth())
  .parse();

