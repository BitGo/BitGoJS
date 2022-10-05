import 'should';

import { TestBitGo } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { Erc20Token } from '../../src';

describe('Eth Token: ', function () {
  let bitgo;

  describe('Eth NFTs in test env:', function () {
    const tokenNames = ['terc721:bitgoerc721'];

    before(function () {
      bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
      // TODO(BG-59021) SHOULD USE A SEPARATE CLASS TO CREATE NFT CONSTRUCTORS
      Erc20Token.createTokenConstructors().forEach(({ name, coinConstructor }) => {
        bitgo.safeRegister(name, coinConstructor);
      });
      bitgo.initializeTestVars();
    });

    tokenNames.forEach((tokenName: string) => {
      it('should return constants', function () {
        const ercToken = bitgo.coin(tokenName);
        ercToken.getChain().should.equal(tokenName);
        // TODO(BG-59021): uncomment test
        // ercToken.getFullName().should.equal('Test BITGO ERC 721 Token');
        ercToken.type.should.equal(tokenName);
        ercToken.coin.should.equal('gteth');
        ercToken.network.should.equal('Testnet');
      });

      it('should return same token by contract address', function () {
        const ercToken = bitgo.coin(tokenName);
        const tokencoinBycontractAddress = bitgo.coin(ercToken.tokenContractAddress);
        ercToken.should.deepEqual(tokencoinBycontractAddress);
      });
    });
  });
});
