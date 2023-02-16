import * as yargs from 'yargs';
import * as assert from 'assert';
import * as utxolib from '@bitgo/utxo-lib';
import { getFixtureString, getTransactionWithSpendType, formatTreeNoColor } from './fixtures';
import { ParserNode } from '../src/Parser';
import { cmdParseTx, getTxParser } from '../src/commands';

function getScriptTypes2Of3() {
  // FIXME(BG-66941): p2trMusig2 signing does not work in this test suite yet
  //  because the test suite is written with TransactionBuilder
  return utxolib.bitgo.outputScripts.scriptTypes2Of3.filter((scriptType) => scriptType !== 'p2trMusig2');
}

getScriptTypes2Of3().forEach((t) => {
  const params: [string, string[]][] = [
    ['default', []],
    ['all', ['--all']],
  ];

  params.forEach(([name, args]) => {
    describe(`parse ${t} spend with ${args.join(' ')}`, function () {
      function parse(tx: utxolib.bitgo.UtxoTransaction, prevOutputs?: utxolib.TxOutput[]): ParserNode {
        return getTxParser(yargs.command(cmdParseTx).parse(args) as any).parse(tx, { prevOutputs });
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
          const formatted = formatTreeNoColor(parse(tx, usePrevOuts ? prevOut : undefined));
          assert.strictEqual(
            formatted,
            await getFixtureString(`test/fixtures/format_${t}_${name}${usePrevOuts ? '_prevOuts' : ''}.txt`, formatted)
          );
        });
      });
    });
  });
});
