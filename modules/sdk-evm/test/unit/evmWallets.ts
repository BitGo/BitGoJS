import { TestBitGo } from '@bitgo/sdk-test';
import { EvmWallets } from '../../src';
import { BitGoAPI } from '@bitgo/sdk-api';

describe('EVM Wallets:', function () {
  const bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
  let evmWallets: EvmWallets;

  before(function () {
    bitgo.initializeTestVars();
    evmWallets = new EvmWallets(bitgo);
  });

  describe('Generate EVM wallet:', function () {
    let params = {};

    it('should validate parameters', async function () {
      await evmWallets.generateEVMWallet(params).should.be.rejectedWith('missing required string parameter label');

      params = { label: 'test123' };
      await evmWallets.generateEVMWallet(params).should.be.rejectedWith('EVM wallet only supports TSS');

      params = { ...params, multisigType: 'blsdkg' };
      await evmWallets.generateEVMWallet(params).should.be.rejectedWith('EVM wallet only supports TSS');

      params = { ...params, multisigType: 'tss' };
      await evmWallets
        .generateEVMWallet(params)
        .should.be.rejectedWith('EVM wallet is only supported for wallet version 3');

      params = { ...params, walletVersion: 2 };
      await evmWallets
        .generateEVMWallet(params)
        .should.be.rejectedWith('EVM wallet is only supported for wallet version 3');
    });

    it('should throw an error for wallet generation', async function () {
      params = {
        label: 'test123',
        multisigType: 'tss',
        walletVersion: 3,
      };
      await evmWallets.generateEVMWallet(params).should.be.rejectedWith('Not implemented');
    });
  });
});
