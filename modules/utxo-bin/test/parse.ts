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
      function parse(tx: utxolib.bitgo.UtxoTransaction): TxNode {
        return getParser(yargs.command(cmdParse).parse(args) as any).parse(tx);
      }

      let tx: utxolib.bitgo.UtxoTransaction;
      before(async function () {
        tx = await getTransactionWithSpendType(utxolib.networks.testnet, t);
      });

      it(`parses`, function () {
        assert.doesNotThrow(() => parse(tx));
      });

      it('formats', async function () {
        const formatted = formatTree(parse(tx), new Instance({ level: 0 }));
        assert.strictEqual(formatted, await getFixtureString(`test/fixtures/format_${t}_${name}.txt`, formatted));
      });
    });
  });
});
