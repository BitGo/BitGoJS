import * as mocha from 'mocha';
import * as yargs from 'yargs';
import * as assert from 'assert';
import * as utxolib from '@bitgo/utxo-lib';
import { formatTreeNoColor, getFixtureString, getTransactionWithSpendType, ParsedFixture } from './fixtures';
import { ParserNode } from '../src/Parser';
import { cmdParseTx, getTxParser } from '../src/commands';
import { ParserTx } from '../src/ParserTx';

type TestParams = {
  scriptType: utxolib.bitgo.outputScripts.ScriptType2Of3;
  spendType: 'keyPath' | 'scriptPath' | undefined;
  fixtureType: 'psbtUnsigned' | 'psbtHalfSigned' | 'psbtFullSigned' | 'networkFullSigned';
  showAll: boolean;
};

function getArgs({ showAll }: { showAll: boolean }): string[] {
  return showAll ? ['--all'] : [];
}

function getParams(): TestParams[] {
  return (['psbtUnsigned', 'psbtHalfSigned', 'psbtFullSigned', 'networkFullSigned'] as const).flatMap((fixtureType) => {
    return [false, true].flatMap((showAll) => {
      return utxolib.bitgo.outputScripts.scriptTypes2Of3.flatMap((scriptType): TestParams[] => {
        if (scriptType === 'p2trMusig2') {
          return [
            { scriptType, spendType: 'keyPath', showAll, fixtureType },
            { scriptType, spendType: 'scriptPath', showAll, fixtureType },
          ];
        }
        return [{ scriptType, spendType: undefined, showAll, fixtureType }];
      });
    });
  });
}

getParams().forEach(({ scriptType, spendType, fixtureType, showAll }) => {
  describe(`parse ${fixtureType} ${scriptType} ${spendType ? spendType : 'default'} spend [args=${getArgs({
    showAll,
  })}`, function () {
    function parse(tx: ParserTx, prevOutputs?: utxolib.TxOutput<bigint>[]): ParserNode {
      return getTxParser(yargs.command(cmdParseTx).parse([...getArgs({ showAll }), '--parseError=throw']) as any).parse(
        tx,
        {
          prevOutputs,
        }
      );
    }

    let fixture: ParsedFixture;
    before(async function () {
      fixture = await getTransactionWithSpendType(utxolib.networks.testnet, {
        scriptType,
        spendType,
        fixtureType,
      });
    });

    it(`parses`, function () {
      parse(fixture.transaction);
      if (fixture.prevOutputs) {
        parse(fixture.transaction, fixture.prevOutputs);
      }
    });

    [false, true].forEach((usePrevOuts) => {
      it(`formats [usePrevOuts=${usePrevOuts}]`, async function (this: mocha.Context) {
        if (usePrevOuts && !fixture.prevOutputs) {
          this.skip();
        }
        const formatted = formatTreeNoColor(parse(fixture.transaction, usePrevOuts ? fixture.prevOutputs : undefined), {
          showAll,
        });
        const fixtureName = spendType ? `${scriptType}_${spendType}` : scriptType;
        const filename = [fixtureName, fixtureType, showAll ? 'all' : '', usePrevOuts ? 'prevOuts' : '']
          .filter((v) => v !== '')
          .join('_');
        assert.strictEqual(
          formatted,
          await getFixtureString(`test/fixtures/formatTransaction/${filename}.txt`, formatted)
        );
      });
    });
  });
});
