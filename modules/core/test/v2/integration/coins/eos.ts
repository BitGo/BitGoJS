import * as should from 'should';
import { TestBitGo } from '../../../lib/test_bitgo';
import { EosInputs, EosResponses } from '../../fixtures/coins/eos';

describe('eos', function() {
  let eosCoin;

  before(function () {
    eosCoin = new TestBitGo({ env: 'test' }).coin('teos');
  });

  describe('explainTransaction', function() {
    const testExplainTransaction = (input, expectedOutput) => async function() {
      const explainedTransaction = await eosCoin.explainTransaction(input);
      should.exist(explainedTransaction);
      explainedTransaction.should.deepEqual(expectedOutput);
    };

    it('explains EOS native transfer transaction', testExplainTransaction(
      EosInputs.explainTransactionInputNative, EosResponses.explainTransactionOutputNative));
    it('explains CHEX token transfer transaction', testExplainTransaction(
      EosInputs.explainTransactionInputChex, EosResponses.explainTransactionOutputChex));
  });
});
