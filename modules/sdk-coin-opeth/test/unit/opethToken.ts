import 'should';
import { getToken, runTokenTestInitialization } from '@bitgo/abstract-eth';
import { OpethToken, register } from '../../src';
import * as testData from '../resources';
import assert from 'assert';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';

describe('Opeth Token Tests', () => {
  const coinName = 'Opeth';
  const tokenNetworkName = 'Optimism Test ERC Token 18 Decimals';

  describe('Opeth tokens in test env:', () => {
    it('Opeth run token tests', () => {
      runTokenTestInitialization(OpethToken, coinName, tokenNetworkName, testData);

      it('should return only one token for optimism token contract address', function () {
        const opToken = 'opeth:op';
        const bitgo: TestBitGoAPI = TestBitGo.decorate(BitGoAPI, { env: 'test' });
        register(bitgo);
        bitgo.initializeTestVars();
        const opTokenCoin: any = bitgo.coin(opToken);
        const token = getToken(
          '0x4200000000000000000000000000000000000042',
          opTokenCoin.getNetwork(),
          opTokenCoin.getFamily()
        );
        assert(token);
        token.name.should.equal('opeth:op');
      });
    });
  });
});
