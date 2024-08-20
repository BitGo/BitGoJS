import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { Etc, Tetc, TransactionBuilder } from '../../src';
import sinon from 'sinon';
import { OfflineVaultTxInfo } from '@bitgo/abstract-eth';

import { BN } from 'ethereumjs-util';

describe('Ethereum Classic', function () {
  let bitgo: TestBitGoAPI;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.initializeTestVars();
    bitgo.safeRegister('etc', Etc.createInstance);
    bitgo.safeRegister('tetc', Tetc.createInstance);
  });

  it('should instantiate the coin', function () {
    let localBasecoin = bitgo.coin('tetc');
    localBasecoin.should.be.an.instanceof(Tetc);

    localBasecoin = bitgo.coin('etc');
    localBasecoin.should.be.an.instanceof(Etc);
  });
});

describe('Wallet Recovery Wizard', function () {
  let sandbox;
  let bitgo: TestBitGoAPI;
  let tetcCoin: Tetc;

  const sourceRootAddress = '0x321cbe223ff1c3d0c03b73b8c648ef2d91e4aaa1';
  const backupKeyAddress = '0x921f162bfd472424d6065b919c3f6e3bf13fe3d7';
  const destinationWalletAddress = '0x76e2dcc49618f3b9769fc8a80b6991388570b3ae';
  const walletPassPhrase = 'Z@oOQ6fkpzjkJXxM<bN1';

  beforeEach(function () {
    sandbox = sinon.createSandbox();
    const callBack = sandbox.stub(Etc.prototype, 'queryAddressBalance' as keyof Etc);
    callBack.withArgs(sourceRootAddress).resolves(new BN('2190000000000000000'));
    callBack.withArgs(backupKeyAddress).resolves(new BN('190000000000000000'));
    callBack.withArgs('0x5273e0d869226ccf579a81b6d291fb3702ba9dec').resolves(new BN('0'));
  });

  afterEach(function () {
    sandbox.restore();
  });

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
    bitgo.safeRegister('tetc', Tetc.createInstance);
    bitgo.initializeTestVars();
  });

  describe('Non-BitGo Recovery', function () {
    beforeEach(function () {
      tetcCoin = bitgo.coin('tetc') as Tetc;
    });

    it('should build a recovery transaction for non-bitgo recovery', async function () {
      const walletContractAddress = sourceRootAddress;
      const recovery = (await tetcCoin.recover({
        userKey:
          '{"iv":"rP+aJBBP5VkYiGmc0KPz4A==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"/B4OU/PQ1Eg=","ct":"HvCzOA23n6WxgFcBdH3ZqrLnZl5NckPPUyC/UDSv/KO8ZPBb1xZVTTY2ZY6/JBG8dHp/ApvAlRFm1SC+MjZ/OF9LC6Zjz8vsoLiS0BHB+z8Z6qB/16aWJbEIRzEmgEkWRn10l9m646GS00qGNHKG1VBURvUOYN4="}',
        backupKey:
          '{"iv":"rDHtZUUKxaCQaIzGMB0b0w==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"0bmqSuxoVlA=","ct":"LyKRuUNVcRzhY5LUF15jKdKOpP04nUHs88FYPK1ZB9yuBSEGduQPjJs+xO62NCDh3pyiX1YeHBe9N6Gsm5Va0jSCk8XQ5pCwNuiO1RXvESAhfrXCivJMfRLVmCgaM79YMWapL7syUa//6mhu/1l4tPBBoZoBYc8="}',
        walletContractAddress,
        walletPassphrase: walletPassPhrase,
        recoveryDestination: destinationWalletAddress,
      })) as OfflineVaultTxInfo;

      recovery.should.not.be.undefined();
      recovery.should.have.property('id');
      recovery.should.have.property('tx');

      const txBuilder = tetcCoin.getTransactionBuilder() as TransactionBuilder;
      txBuilder.from(recovery.tx);
      const tx = await txBuilder.build();
      tx.toBroadcastFormat().should.not.be.empty();
    });

    it('should error when the backup key is unfunded (cannot pay gas)', async function () {
      await tetcCoin
        .recover({
          userKey:
            '{"iv":"RI3d7nXJnnMTJFEKE5U6CA==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"qZtZ8FXlr5I=","ct":"F49E7Pi3duSQ9v1iauXuQ6q6SqmGHLPQ9RNJTmfJp0AH2mwNe1bl/pMpwsaT12Ay3x3roLsi5+WFzePK8q1z43xwKfMWjTdsxj0yHpwa+8kOyckEnKyZ5J/AUw0nS7ujegTelaKR/wT2D+mvpJejQ+NRs9Lvyrg="}\n',
          backupKey:
            '{"iv":"XJPzySPeTTAbLVol9fsQUA==","v":1,"iter":10000,"ks":256,"ts":64,"mode":"ccm","adata":"","cipher":"aes","salt":"6LzbWSvK9Wo=","ct":"8fBnXkAX38ZtoHjN9MBUSkJ3dGgR8FuAmOo1sO7XfOu6Pan23YVpy468dKgl0C+UkzBQbnepNQ0UOf3kEudTYqt3/HgtvUcDdkkD3YDfEF1gVN7ndiBabF2C3SwnMNxUkuD0n5YWaRmaBPo+A2AGj4VrQ0wzFZs="}',
          walletContractAddress: destinationWalletAddress,
          walletPassphrase: walletPassPhrase,
          recoveryDestination: sourceRootAddress,
        })
        .should.be.rejectedWith(
          'Backup key address 0x5273e0d869226ccf579a81b6d291fb3702ba9dec has balance  0 Gwei.This address must have a balance of at least 10000000 Gwei to perform recoveries. Try sending some funds to this address then retry.'
        );
    });

    it('should get the next sequence id for an address', async function () {
      const baseCoin = bitgo.coin('tetc') as Tetc;
      const walletContractAddress = '0x2E0b5638Bf3F774AF116029b09415AA9FDD812d5';
      const sequenceId = await baseCoin.querySequenceId(walletContractAddress);
      sequenceId.should.not.be.undefined();
    });
  });

  // Add tests related to unsigned sweep here if any
  describe('Unsigned sweep', function () {
    beforeEach(function () {
      tetcCoin = bitgo.coin('tetc') as Tetc;
    });
  });
});
