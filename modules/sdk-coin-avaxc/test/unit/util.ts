import assert from 'assert';
import should from 'should';
import { NetworkType } from '@bitgo/statics';
import { TEST_ACCOUNT, TEST_ACCOUNT_2 } from '../resources/avaxc';
import { isValidEthAddress, isValidEthPrivateKey, isValidEthPublicKey, sign, getCommon } from '../../src/lib/utils';

import { getBuilder } from './getBuilder';
import { TransactionType } from '@bitgo/sdk-core';
import { KeyPair, TransactionBuilder } from '../../src';
import { ETHTransactionType, TxData } from '@bitgo/sdk-coin-eth';

describe('AVAX util library', () => {
  describe('keys validations success cases', () => {
    it('validate valid eth private key', () => {
      should.equal(isValidEthPrivateKey(TEST_ACCOUNT.ethPrivateKey), true);
    });

    it('validate valid eth public key', () => {
      should.equal(isValidEthPublicKey(TEST_ACCOUNT.ethUncompressedPublicKey), true);
    });

    it('validate valid eth address', () => {
      should.equal(isValidEthAddress(TEST_ACCOUNT.ethAddress), true);
    });
  });

  describe('keys validations failure cases', () => {
    it('validate empty eth private key', () => {
      should.equal(isValidEthPrivateKey(''), false);
    });

    it('validate empty eth public key', () => {
      should.equal(isValidEthPublicKey(''), false);
    });

    it('validate empty eth address', () => {
      should.equal(isValidEthAddress(''), false);
    });

    it('validate eth private key too short', () => {
      should.equal(isValidEthPrivateKey(TEST_ACCOUNT.ethPrivateKey.slice(1)), false);
    });

    it('validate eth public key too short', () => {
      should.equal(isValidEthPublicKey(TEST_ACCOUNT.ethUncompressedPublicKey.slice(1)), false);
    });

    it('validate eth address too short', () => {
      should.equal(isValidEthAddress(TEST_ACCOUNT.ethAddress.slice(1)), false);
    });

    it('validate eth private key too long', () => {
      should.equal(isValidEthPrivateKey(TEST_ACCOUNT.ethPrivateKey + '00'), false);
    });

    it('validate eth public key too long', () => {
      should.equal(isValidEthPublicKey(TEST_ACCOUNT.ethUncompressedPublicKey + '00'), false);
    });

    it('validate eth address too long', () => {
      should.equal(isValidEthAddress(TEST_ACCOUNT.ethAddress + '00'), false);
    });
  });

  describe('sign success cases', () => {
    let txBuilder: TransactionBuilder;
    const contractAddress = TEST_ACCOUNT.ethAddress;
    const initTxBuilder = (): void => {
      txBuilder = getBuilder('tavaxc') as TransactionBuilder;
      txBuilder.fee({
        fee: '280000000000',
        gasLimit: '7000000',
      });
      txBuilder.counter(1);
      txBuilder.type(TransactionType.Send);
      txBuilder.contract(contractAddress);
      txBuilder.transfer().amount('10000').to(TEST_ACCOUNT_2.ethAddress).contractSequenceId(1);
    };

    beforeEach(() => {
      initTxBuilder();
    });

    it('sign a valid txData with valid KeyPair', async () => {
      const tx = await txBuilder.build();
      const txData = tx.toJson();

      should.not.exists(txData.r);
      should.not.exists(txData.s);
      should.equal(txData.v, '0x0150f5');

      const keyPair = new KeyPair({ prv: TEST_ACCOUNT_2.ethPrivateKey });
      const signedTx = await sign(txData, keyPair);
      const txBuilder2 = getBuilder('tavaxc') as TransactionBuilder;
      txBuilder2.from(signedTx);
      const tx2 = await txBuilder2.build();
      const tx2Data = tx2.toJson();

      should.exists(tx2Data.r);
      should.exists(tx2Data.s);
      should.exists(tx2Data.v);
      tx2Data.r.length.should.be.above(0);
      tx2Data.s.length.should.be.above(0);
      tx2Data.v.length.should.be.above(0);
    });

    it('sign txData with gasLimit set as number', async () => {
      const txData: TxData = {
        _type: ETHTransactionType.LEGACY,
        data: '',
        gasLimit: '1',
        gasPrice: '0x0',
        nonce: 1,
        value: '0',
      };
      const keyPair = new KeyPair({ prv: TEST_ACCOUNT_2.ethPrivateKey });
      sign(txData, keyPair).should.be.fulfilled();
    });

    it('sign txData with gasPrice set as number', async () => {
      const txData: TxData = {
        _type: ETHTransactionType.LEGACY,
        data: '',
        gasLimit: '0x1',
        gasPrice: '1',
        nonce: 1,
        value: '0',
      };
      const keyPair = new KeyPair({ prv: TEST_ACCOUNT_2.ethPrivateKey });
      sign(txData, keyPair).should.be.fulfilled();
    });

    it('sign txData with hex gasLimit and gasPrice values', async () => {
      const txData: TxData = {
        _type: ETHTransactionType.LEGACY,
        data: '',
        gasLimit: '0x1',
        gasPrice: '0x1',
        nonce: 1,
        value: '0',
      };
      const keyPair = new KeyPair({ prv: TEST_ACCOUNT_2.ethPrivateKey });
      sign(txData, keyPair).should.be.fulfilled();
    });

    it('sign txData with nonce zero', async () => {
      const txData: TxData = {
        _type: ETHTransactionType.LEGACY,
        data: '',
        gasLimit: '0x1',
        gasPrice: '0x1',
        nonce: 0,
        value: '0',
      };
      const keyPair = new KeyPair({ prv: TEST_ACCOUNT_2.ethPrivateKey });
      sign(txData, keyPair).should.be.fulfilled();
    });

    it('sign txData with value set as number', async () => {
      const txData: TxData = {
        _type: ETHTransactionType.LEGACY,
        data: '',
        gasLimit: '0x1',
        gasPrice: '0x1',
        nonce: 0,
        value: '0',
      };
      const keyPair = new KeyPair({ prv: TEST_ACCOUNT_2.ethPrivateKey });
      sign(txData, keyPair).should.be.fulfilled();
    });

    it('sign txData with value set as hex', async () => {
      const txData: TxData = {
        _type: ETHTransactionType.LEGACY,
        data: '',
        gasLimit: '0x1',
        gasPrice: '0x1',
        nonce: 0,
        value: '0x0',
      };
      const keyPair = new KeyPair({ prv: TEST_ACCOUNT_2.ethPrivateKey });
      sign(txData, keyPair).should.be.fulfilled();
    });
  });

  describe('sign failure cases', () => {
    it('sign txData with invalid gasLimit', async () => {
      const txData: TxData = {
        _type: ETHTransactionType.LEGACY,
        data: '',
        gasLimit: '',
        gasPrice: '0x0',
        nonce: 1,
        value: '0',
      };
      const keyPair = new KeyPair({ prv: TEST_ACCOUNT_2.ethPrivateKey });
      sign(txData, keyPair).should.be.rejectedWith(new RegExp('Cannot convert string to buffer.+'));
    });

    it('sign txData with invalid gasPrice', async () => {
      const txData: TxData = {
        _type: ETHTransactionType.LEGACY,
        data: '',
        gasLimit: '0x0',
        gasPrice: '',
        nonce: 1,
        value: '0',
      };
      const keyPair = new KeyPair({ prv: TEST_ACCOUNT_2.ethPrivateKey });
      sign(txData, keyPair).should.be.rejectedWith(new RegExp('Cannot convert string to buffer.+'));
    });

    it('sign txData with invalid nonce', async () => {
      const txData: TxData = {
        _type: ETHTransactionType.LEGACY,
        data: '',
        gasLimit: '0x0',
        gasPrice: '0x0',
        nonce: -1,
        value: '0',
      };
      const keyPair = new KeyPair({ prv: TEST_ACCOUNT_2.ethPrivateKey });
      sign(txData, keyPair).should.be.rejectedWith(new RegExp('Cannot convert string to buffer.+'));
    });

    it('sign txData with invalid value', async () => {
      const txData: TxData = {
        _type: ETHTransactionType.LEGACY,
        data: '',
        gasLimit: '0x0',
        gasPrice: '0x0',
        nonce: 1,
        value: '',
      };
      const keyPair = new KeyPair({ prv: TEST_ACCOUNT_2.ethPrivateKey });
      sign(txData, keyPair).should.be.rejectedWith(new RegExp('Cannot convert string to buffer.+'));
    });
  });

  describe('network common configuration', () => {
    it('getCommon for mainnet', () => {
      const common = getCommon(NetworkType.MAINNET);
      should.equal(common.chainName(), 'mainnet');
      should.equal(common.hardfork(), 'london');
      should.equal(common.chainIdBN().toString(), '43114');
      should.equal(common.networkIdBN().toString(), '1');
    });

    it('getCommon for testnet', () => {
      const common = getCommon(NetworkType.TESTNET);
      should.equal(common.chainName(), 'fuji');
      should.equal(common.hardfork(), 'london');
      should.equal(common.chainIdBN().toString(), '43113');
      should.equal(common.networkIdBN().toString(), '1');
    });

    it('getCommon for invalid network', () => {
      assert.throws(
        () => getCommon('invalidNetwork' as NetworkType),
        (e: any) => e.message === 'Missing network common configuration'
      );
    });
  });
});
