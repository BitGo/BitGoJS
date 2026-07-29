/**
 * Tests for explainTransactionWasm (WASM-based Solana transaction explanation).
 */
import 'should';
import { explainSolTransaction } from '../../src/lib/explainTransactionWasm';

describe('explainTransactionWasm', function () {
  describe('deriveTransactionType', function () {
    it('should classify boilerplate-only transaction as CustomTx', function () {
      // Transaction with only NonceAdvance + Memo instructions (no Transfer or TokenTransfer).
      // Previously this would incorrectly fall through to 'Send'.
      const BOILERPLATE_ONLY_TX_BASE64 =
        'AgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADE3aDK9nmEccOmQJ4crZzPuTnRVa3woFSjKzE2hcsFbNkpvA8Lnj7CVeJ+/UfXwLI5g223D02m4+REUfPc50QCAgEEB8OpoX+Ybq/j8xi80DhFtj8AUVHPrjhK1E3DnT5Bmx346iUtYQKMMBolIAO6PmfJh3w7huFcYcGNOB8sgXN38Wg6ZrWANNJfb64q8B242qfRiT7dffb80H2OoXGQ0aq0lAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABUpTWpkpIQZNJOhxYNo4fHw1td28kruB5B+oQEEFRI0Gp9UXGMd0yShWY5hpHV62i164o5tLbVxzVVshAAAAAAan1RcZLFaO4IqEX3PSl4jPA1wxRbIas0TYBi6pQAAAEHPqtGYOjjqVfHgg1S32M4qMe2AQO/kDy1+CEYQwkisDAwMCBgEEBAAAAAQCAAUJSGVsbG8gQVBJBAAnQVBJIEludGVncmF0aW9uIHRlc3QgY3VzdG9tIHRyYW5zYWN0aW9u';

      const explained = explainSolTransaction({
        txBase64: BOILERPLATE_ONLY_TX_BASE64,
        feeInfo: { fee: '5000' },
        coinName: 'tsol',
      });

      explained.type.should.equal('CustomTx');
      explained.outputAmount.should.equal('0');
      explained.outputs.length.should.equal(0);
      (typeof explained.memo).should.equal('string');
    });
  });
});
