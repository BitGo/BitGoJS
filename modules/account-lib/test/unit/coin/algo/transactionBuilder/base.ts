import { BaseCoin as CoinConfig, coins } from '@bitgo/statics';
import should from 'should';
import sinon, { assert } from 'sinon';
import { AddressValidationError, InsufficientFeeError, TransactionBuilder } from '../../../../../src/coin/algo';
import { BaseTransaction } from '../../../../../src/coin/baseCoin';
import { NotImplementedError } from '../../../../../src/coin/baseCoin/errors';
import { BaseKey } from '../../../../../src/coin/baseCoin/iface';

import * as AlgoResources from '../../../../resources/algo';

class StubTransactionBuilder extends TransactionBuilder {
  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
  }

  protected fromImplementation(rawTransaction: unknown): BaseTransaction {
    throw new NotImplementedError('fromImplementation not implemented');
  }
  protected signImplementation(key: BaseKey): BaseTransaction {
    throw new NotImplementedError('signImplementation not implemented');
  }
  protected buildImplementation(): Promise<BaseTransaction> {
    throw new NotImplementedError('buildImplementation not implemented');
  }
}

describe('Algo Transaction Builder', () => {
  let txnBuilder: StubTransactionBuilder;

  const {
    accounts: { account1 },
  } = AlgoResources;

  beforeEach(() => {
    const config = coins.get('algo');
    txnBuilder = new StubTransactionBuilder(config);
  });

  describe('setter validation', () => {
    it('should validate fee is not lt 1000 microalgos if flat fee is set to true', () => {
      txnBuilder.isFlatFee(true);

      should.throws(
        () => txnBuilder.fee({ fee: '999' }),
        (e: Error) => e.name === InsufficientFeeError.name,
      );
      should.doesNotThrow(() => txnBuilder.fee({ fee: '1000' }));
    });

    it('should validate sender address is a valid algo address', () => {
      const spy = sinon.spy(txnBuilder, 'sender');
      should.throws(
        () => txnBuilder.sender({ address: 'asdf' }),
        (e: Error) => e.name === AddressValidationError.name,
      );
      should.doesNotThrow(() => txnBuilder.sender({ address: account1.address }));
      assert.calledTwice(spy);
    });
  });

  describe('private key validation', () => {
    it('validates byte arrays', () => {
      should.doesNotThrow(() => txnBuilder.validateKey({ key: account1.secretKey }));
    });

    it('validates hex encoded strings', () => {
      should.doesNotThrow(() => txnBuilder.validateKey({ key: account1.secretKey.toString('hex') }));
    });

    it('validates base64 encoded strings', () => {
      should.doesNotThrow(() => txnBuilder.validateKey({ key: account1.secretKey.toString('base64') }));
    });
  });
});
