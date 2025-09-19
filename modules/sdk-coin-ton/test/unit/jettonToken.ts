import 'should';

import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { JettonToken } from '../../src';
import utils from '../../src/lib/utils';

describe('Jetton Tokens', function () {
  let bitgo: TestBitGoAPI;
  let testnetJettonToken;
  let mainnetJettonToken;
  const testnetTokenName = 'tton:ukwny-us';
  const mainnetTokenName = 'ton:usdt';

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
    JettonToken.createTokenConstructors().forEach(({ name, coinConstructor }) => {
      bitgo.safeRegister(name, coinConstructor);
    });
    bitgo.initializeTestVars();
    testnetJettonToken = bitgo.coin(testnetTokenName);
    mainnetJettonToken = bitgo.coin(mainnetTokenName);
  });

  it('should return constants for Testnet Ton token', function () {
    testnetJettonToken.getChain().should.equal(testnetTokenName);
    testnetJettonToken.getBaseChain().should.equal('tton');
    testnetJettonToken.getFullName().should.equal('Ton Token');
    testnetJettonToken.getBaseFactor().should.equal(1e9);
    testnetJettonToken.type.should.equal(testnetTokenName);
    testnetJettonToken.name.should.equal('Test Unknown TokenY-US');
    testnetJettonToken.coin.should.equal('tton');
    testnetJettonToken.network.should.equal('Testnet');
    testnetJettonToken.contractAddress.should.equal('kQD8EQMavE1w6gvgMXUhN8hi7pSk4bKYM-W2dgkNqV54Y16Y');
    testnetJettonToken.decimalPlaces.should.equal(9);
  });

  it('should return constants for Mainnet Ton token', function () {
    mainnetJettonToken.getChain().should.equal(mainnetTokenName);
    mainnetJettonToken.getBaseChain().should.equal('ton');
    mainnetJettonToken.getFullName().should.equal('Ton Token');
    mainnetJettonToken.getBaseFactor().should.equal(1e6);
    mainnetJettonToken.type.should.equal(mainnetTokenName);
    mainnetJettonToken.name.should.equal('Ton USDT');
    mainnetJettonToken.coin.should.equal('ton');
    mainnetJettonToken.network.should.equal('Mainnet');
    mainnetJettonToken.contractAddress.should.equal('EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs');
    mainnetJettonToken.decimalPlaces.should.equal(6);
  });

  it('should derive the correct jetton token address for a testnet token and ton address when bounceable is false', async function () {
    // doesn't matter if the ton address is bounceable or not, the result should be the same
    const tonAddress = 'UQB-CM6DF-jpq9XVdiSdefAMU5KC1gpZuYBFp-Q65aUhn0OP';
    const jettonWalletAddress = await utils.getJettonWalletAddress(
      testnetJettonToken.type,
      tonAddress,
      testnetJettonToken.contractAddress,
      false
    );
    jettonWalletAddress.should.equal('UQDOrQKvZ2T5NzGYMLCKMZ4hdezBmnXHMk4BUEqNEE9dZryd');
  });

  it('should derive the correct jetton token address for a testnet token and ton address when bounceable is true', async function () {
    // doesn't matter if the ton address is bounceable or not, the result should be the same
    const tonAddress = 'UQB-CM6DF-jpq9XVdiSdefAMU5KC1gpZuYBFp-Q65aUhn0OP';
    const jettonWalletAddress = await utils.getJettonWalletAddress(
      testnetJettonToken.type,
      tonAddress,
      testnetJettonToken.contractAddress,
      true
    );
    jettonWalletAddress.should.equal('EQDOrQKvZ2T5NzGYMLCKMZ4hdezBmnXHMk4BUEqNEE9dZuFY');
  });

  it('should derive the correct jetton token address for a mainnet token and ton address when bounceable is false', async function () {
    // doesn't matter if the ton address is bounceable or not, the result should be the same
    const tonAddress = 'UQCj22Hf6cbLcmWuvU3EhDEvRW6tFEH7ts_LFbbZzNyJ9dx6';
    const jettonWalletAddress = await utils.getJettonWalletAddress(
      mainnetJettonToken.type,
      tonAddress,
      mainnetJettonToken.contractAddress,
      false
    );
    jettonWalletAddress.should.equal('UQDNHH5YIOBaFG4fRO18ZGGWqG6UgnqmYsjBWTf9FYH8xvVM');
  });

  it('should derive the correct jetton token address for a mainnet token and ton address when bounceable is true', async function () {
    // doesn't matter if the ton address is bounceable or not, the result should be the same
    const tonAddress = 'UQCj22Hf6cbLcmWuvU3EhDEvRW6tFEH7ts_LFbbZzNyJ9dx6';
    const jettonWalletAddress = await utils.getJettonWalletAddress(
      mainnetJettonToken.type,
      tonAddress,
      mainnetJettonToken.contractAddress,
      true
    );
    jettonWalletAddress.should.equal('EQDNHH5YIOBaFG4fRO18ZGGWqG6UgnqmYsjBWTf9FYH8xqiJ');
  });

  it('should throw an error when an invalid token name is provided', async function () {
    const tonAddress = 'UQCj22Hf6cbLcmWuvU3EhDEvRW6tFEH7ts_LFbbZzNyJ9dx6';
    await utils
      .getJettonWalletAddress('invalid-token-name', tonAddress, mainnetJettonToken.contractAddress, true)
      .should.be.rejectedWith(
        'Failed to get jetton wallet address: The first argument must be of type string or an instance of Buffer, ArrayBuffer, or Array or an Array-like Object. Received undefined'
      );
  });

  it('should throw an error when an invalid ton address is provided', async function () {
    const tonAddress = 'UQBk22Hf6cbLcmWuvU3EhDEvRW6tFEH7ts_LFbbZzNyJ9dx6';
    await utils
      .getJettonWalletAddress(mainnetJettonToken.type, tonAddress, mainnetJettonToken.contractAddress, true)
      .should.be.rejectedWith(
        'Failed to get jetton wallet address: Invalid checksum: UQBk22Hf6cbLcmWuvU3EhDEvRW6tFEH7ts/LFbbZzNyJ9dx6'
      );
  });

  it('should throw an error when an invalid token contract address is provided', async function () {
    const tonAddress = 'UQCj22Hf6cbLcmWuvU3EhDEvRW6tFEH7ts_LFbbZzNyJ9dx6';
    await utils
      .getJettonWalletAddress(mainnetJettonToken.type, tonAddress, 'invalid-contract-address', true)
      .should.be.rejectedWith('Failed to get jetton wallet address: Unknown address type: invalid-contract-address');
  });
});
