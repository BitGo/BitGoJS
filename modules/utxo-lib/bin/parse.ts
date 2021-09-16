/**
 * @prettier
 */

/* eslint-disable no-console */
import * as yargs from 'yargs';
import * as process from 'process';
import * as fs from 'fs';

import * as utxolib from '../src';
import { createTransactionFromHex, UtxoTransaction } from '../src/bitgo';

function hashToTxId(hash: Buffer): string {
  return Buffer.from(hash).reverse().toString('hex');
}

function logLine(label, value, indent = 0): string {
  return [Array.from({ length: indent }).fill(' ').join(''), label.padEnd(32), value].join('');
}

function dumpTransactionInputASM(tx: UtxoTransaction, input: utxolib.TxInput, i: number) {
  console.log(logLine(`input ${i} script:`, input.script.toString('hex') || '[empty]', 2));
  if (input.script) {
    const type = utxolib.classify.input(input.script, true);
    const decompiled = utxolib.script.decompile(input.script);
    console.log(logLine(`input ${i} script type:`, type + (decompiled ? '' : ' [decompile error]'), 2));
    if (decompiled) {
      decompiled.forEach((chunk, j) => {
        console.log(logLine(`chunk ${j}`, Buffer.isBuffer(chunk) ? chunk.toString('hex') : chunk, 4));
      });

      if (type === 'scripthash') {
        const scriptBin = decompiled[decompiled.length - 1];
        if (Buffer.isBuffer(scriptBin)) {
          console.log(logLine(`script asm`, utxolib.script.toASM(scriptBin), 6));
        } else {
          console.log(logLine(`script`, 6));
        }
      }
    }
  }
  input.witness.forEach((w, j) => {
    console.log(logLine(`witness ${j}:`, w.toString('hex'), 4));
  });
}

function dumpTransactionInputParseSignature(tx: UtxoTransaction, input: utxolib.TxInput, i: number) {
  const parsed = utxolib.bitgo.parseSignatureScript(input);
  console.log(logLine(`input ${i} script type:`, parsed.scriptType ?? 'undefined', 2));
  switch (parsed.scriptType) {
    case undefined:
      logLine(`input ${i} signatures`, `empty`, 4);
      return;
    case 'p2sh':
    case 'p2shP2wsh':
    case 'p2wsh':
      parsed.signatures.forEach((sig, j) => {
        console.log(
          logLine(
            `input ${i} signature ${j}`,
            Buffer.isBuffer(sig)
              ? sig.toString('hex')
              : utxolib.bitgo.isPlaceholderSignature(sig)
              ? sig + ' (placeholder)'
              : sig,
            4
          )
        );
      });
  }
}

type InputFormat = 'asm' | 'parseSignature';

function dumpTransaction(tx: UtxoTransaction, params: { inputFormat: InputFormat }) {
  console.log(logLine('id:', tx.getId()));
  console.log(logLine('version:', tx.version));
  console.log(logLine('hasWitnesses:', tx.hasWitnesses()));
  console.log(logLine('nInputs:', tx.ins.length));
  console.log(logLine('nOutputs:', tx.outs.length));

  console.log('inputs:');
  tx.ins.forEach((input, i) => {
    console.log(logLine(`input ${i}:`, `${hashToTxId(input.hash)}:${input.index}`, 2));
    console.log(logLine(`input ${i} script:`, `${input.script.length} bytes`, 2));
    console.log(logLine(`input ${i} witness:`, `${input.witness.map((b) => `${b.length} bytes`).join(' ')}`, 2));
    if (params.inputFormat === 'asm') {
      dumpTransactionInputASM(tx, input, i);
    }
    if (params.inputFormat === 'parseSignature') {
      dumpTransactionInputParseSignature(tx, input, i);
    }
  });

  console.log('outputs:');
  tx.outs.forEach((o, i) => {
    console.log(logLine(`output ${i}:`, `${utxolib.address.fromOutputScript(o.script, tx.network)}`, 2));
    console.log(logLine(`output ${i} value:`, `${o.value / 1e8}`, 2));
  });
}

yargs
  .command({
    command: 'parse',
    builder(b) {
      b = b
        .option('network', { alias: 'n', type: 'string' })
        .option('inputFormat', { choice: ['asm', 'parseSignature'] });
      return b;
    },
    handler(argv) {
      const network = utxolib.networks[argv.network as string];
      if (!network) {
        throw new Error(`invalid network ${network}`);
      }

      const data = fs.readFileSync(process.stdin.fd, 'utf8').replace(/\s*/g, '');
      const tx = createTransactionFromHex(data, network);
      dumpTransaction(tx, { inputFormat: argv.inputFormat as InputFormat });
    },
  })
  .help()
  .parse();
