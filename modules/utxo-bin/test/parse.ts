import * as yargs from 'yargs';
import * as assert from 'assert';
import { Instance } from 'chalk';
import * as utxolib from '@bitgo/utxo-lib';
import { getFixtureString, getTransactionWithSpendType } from './fixtures';
import { TxNode } from '../src/parse';
import { formatTree } from '../src/format';
import { cmdParse, getParser } from '../src/commands';

utxolib.bitgo.outputScripts.scriptTypes2Of3.forEach((t) => {
  const params: [string, string[]][] = [
    ['default', []],
    ['all', ['--all']],
  ];
  params.forEach(([name, args]) => {
    describe(`parse ${t} spend with ${args.join(' ')}`, function () {
      function parse(tx: utxolib.bitgo.UtxoTransaction, prevOutputs?: utxolib.TxOutput[]): TxNode {
        return getParser(yargs.command(cmdParse).parse(args) as any).parse(tx, { prevOutputs });
      }

      let tx: utxolib.bitgo.UtxoTransaction;
      let prevOut: utxolib.TxOutput[];
      before(async function () {
        [tx, prevOut] = await getTransactionWithSpendType(utxolib.networks.testnet, t);
      });

      it(`parses`, function () {
        assert.doesNotThrow(() => parse(tx));
        assert.doesNotThrow(() => parse(tx, prevOut));
      });

      [false, true].forEach((usePrevOuts) => {
        it(`formats [usePrevOuts=${usePrevOuts}]`, async function () {
          const formatted = formatTree(parse(tx, usePrevOuts ? prevOut : undefined), {
            chalk: new Instance({ level: 0 }),
          });
          assert.strictEqual(
            formatted,
            await getFixtureString(`test/fixtures/format_${t}_${name}${usePrevOuts ? '_prevOuts' : ''}.txt`, formatted)
          );
        });
      });
    });
  });
});
