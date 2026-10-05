import 'should';
import {
  compileTransactionMessage,
  parseWireTransaction,
  serializeWireTransaction,
  type TransactionConfig,
} from '../../../src';

describe('v1 serializer public exports', () => {
  it('exposes the v1 primitives from the package index', () => {
    (typeof compileTransactionMessage).should.equal('function');
    (typeof parseWireTransaction).should.equal('function');
    (typeof serializeWireTransaction).should.equal('function');
  });
  it('accepts a TransactionConfig shape', () => {
    const cfg: TransactionConfig = {
      priorityFee: 1000,
      computeUnitLimit: 200000,
      loadedAccountsDataSizeLimit: 0,
      heapSize: null,
    };
    cfg.should.be.an.Object();
  });
});
