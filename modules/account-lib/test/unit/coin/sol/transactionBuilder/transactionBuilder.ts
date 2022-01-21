import should from 'should';
import { register } from '../../../../../src';
import { TransactionBuilderFactory, KeyPair } from '../../../../../src/coin/sol';
import { TransactionType } from '../../../../../src/coin/baseCoin';
import * as testData from '../../../../resources/sol/sol';
import BigNumber from 'bignumber.js';

describe('Sol Transaction Builder', async () => {
  let builders;
  const factory = register('tsol', TransactionBuilderFactory);
  const authAccount = new KeyPair(testData.authAccount).getKeys();
  const nonceAccount = new KeyPair(testData.nonceAccount).getKeys();
  const validBlockhash = 'GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi';

  beforeEach(function (done) {
    builders = [
      factory.getWalletInitializationBuilder(),
      factory.getTransferBuilder(),
      factory.getStakingActivateBuilder(),
    ];
    done();
  });

  it('start and build an empty a transfer tx with fee', async () => {
    const txBuilder = factory.getTransferBuilder();
    txBuilder.sender(authAccount.pub);
    txBuilder.nonce(validBlockhash);
    txBuilder.fee({ amount: 5000 });
    const tx = await txBuilder.build();
    should.equal(tx.type, TransactionType.Send);

    const txJson = tx.toJson();
    txJson.lamportsPerSignature?.should.equal(5000);
  });

  it('should fail to build if missing sender', async () => {
    for (const txBuilder of builders) {
      txBuilder.nonce(validBlockhash);
      await txBuilder.build().should.rejectedWith('Invalid transaction: missing sender');
    }
  });

  it('should fail to build if missing nonce', async () => {
    for (const txBuilder of builders) {
      txBuilder.sender(authAccount.pub);
      await txBuilder.build().should.rejectedWith('Invalid transaction: missing nonce blockhash');
    }
  });

  it('build a wallet init from rawTx', async () => {
    const txBuilder = factory.from(testData.WALLET_INIT_SIGNED_TX);
    const builtTx = await txBuilder.build();
    should.equal(builtTx.type, TransactionType.WalletInitialization);
    should.equal(
      builtTx.id,
      '2QdKALq4adaTahJH13AGzM5bAFuNshw43iQBdVS9D2Loq736zUgPXfHj32cNJKX6FyjUzYJhGfEyAAB5FgYUW6zR',
    );
    builtTx.inputs.length.should.equal(1);
    builtTx.inputs[0].should.deepEqual({
      address: '5hr5fisPi6DXNuuRpm5XUbzpiEnmdyxXuBDTwzwZj5Pe',
      value: '300000',
      coin: 'tsol',
    });
    builtTx.outputs.length.should.equal(0);
    const jsonTx = builtTx.toJson();
    jsonTx.id.should.equal('2QdKALq4adaTahJH13AGzM5bAFuNshw43iQBdVS9D2Loq736zUgPXfHj32cNJKX6FyjUzYJhGfEyAAB5FgYUW6zR');
    jsonTx.feePayer.should.equal('5hr5fisPi6DXNuuRpm5XUbzpiEnmdyxXuBDTwzwZj5Pe');
    jsonTx.nonce.should.equal('GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi');
    jsonTx.numSignatures.should.equal(2);
    jsonTx.instructionsData.should.deepEqual([
      {
        type: 'CreateNonceAccount',
        params: {
          fromAddress: '5hr5fisPi6DXNuuRpm5XUbzpiEnmdyxXuBDTwzwZj5Pe',
          nonceAddress: '8Y7RM6JfcX4ASSNBkrkrmSbRu431YVi9Y3oLFnzC2dCh',
          authAddress: '5hr5fisPi6DXNuuRpm5XUbzpiEnmdyxXuBDTwzwZj5Pe',
          amount: '300000',
        },
      },
    ]);
    builtTx.toBroadcastFormat().should.equal(testData.WALLET_INIT_SIGNED_TX);
  });

  it('build a staking activate from rawTx', async () => {
    const txBuilder = factory.from(testData.STAKING_ACTIVATE_SIGNED_TX);
    const builtTx = await txBuilder.build();
    should.equal(builtTx.type, TransactionType.StakingActivate);
    should.equal(
      builtTx.id,
      '2oA7BvodsSiDTfjjswMRmucj8WD86esqfvnSkqKiKtPZ8oXSGB72L87LMppw1Ag7PbEKsKLczqh2p6uzukuCTrhF',
    );
    builtTx.inputs.length.should.equal(1);
    builtTx.inputs[0].should.deepEqual({
      address: '5hr5fisPi6DXNuuRpm5XUbzpiEnmdyxXuBDTwzwZj5Pe',
      value: '300000',
      coin: 'tsol',
    });
    builtTx.outputs.length.should.equal(1);
    const jsonTx = builtTx.toJson();
    jsonTx.id.should.equal('2oA7BvodsSiDTfjjswMRmucj8WD86esqfvnSkqKiKtPZ8oXSGB72L87LMppw1Ag7PbEKsKLczqh2p6uzukuCTrhF');
    jsonTx.feePayer.should.equal('5hr5fisPi6DXNuuRpm5XUbzpiEnmdyxXuBDTwzwZj5Pe');
    jsonTx.nonce.should.equal('GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi');
    jsonTx.numSignatures.should.equal(2);
    jsonTx.instructionsData.should.deepEqual([
      {
        type: 'Activate',
        params: {
          fromAddress: '5hr5fisPi6DXNuuRpm5XUbzpiEnmdyxXuBDTwzwZj5Pe',
          stakingAddress: '7dRuGFbU2y2kijP6o1LYNzVyz4yf13MooqoionCzv5Za',
          amount: '300000',
          validator: 'CyjoLt3kjqB57K7ewCBHmnHq3UgEj3ak6A7m6EsBsuhA',
        },
      },
    ]);
    builtTx.toBroadcastFormat().should.equal(testData.STAKING_ACTIVATE_SIGNED_TX);
  });

  it('build a send from rawTx', async () => {
    const txBuilder = factory.from(testData.TRANSFER_SIGNED_TX_WITH_MEMO_AND_DURABLE_NONCE);
    const builtTx = await txBuilder.build();
    should.equal(builtTx.type, TransactionType.Send);
    should.equal(
      builtTx.id,
      '5bzBmWctovza21BCUc9aywJjkKyvA1EKBEfL1RXHno4SGBSQ5Tcwq2geXMSEygoKM4ojAB47iTe4p9639yxFFndT',
    );
    builtTx.inputs.length.should.equal(1);
    builtTx.inputs[0].should.deepEqual({
      address: '5hr5fisPi6DXNuuRpm5XUbzpiEnmdyxXuBDTwzwZj5Pe',
      value: '300000',
      coin: 'tsol',
    });
    builtTx.outputs.length.should.equal(1);
    builtTx.outputs[0].should.deepEqual({
      address: 'CP5Dpaa42RtJmMuKqCQsLwma5Yh3knuvKsYDFX85F41S',
      value: '300000',
      coin: 'tsol',
    });
    const jsonTx = builtTx.toJson();
    jsonTx.id.should.equal('5bzBmWctovza21BCUc9aywJjkKyvA1EKBEfL1RXHno4SGBSQ5Tcwq2geXMSEygoKM4ojAB47iTe4p9639yxFFndT');
    jsonTx.feePayer.should.equal('5hr5fisPi6DXNuuRpm5XUbzpiEnmdyxXuBDTwzwZj5Pe');
    jsonTx.nonce.should.equal('GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi');
    jsonTx.numSignatures.should.equal(1);
    jsonTx.durableNonce.should.deepEqual({
      walletNonceAddress: '8Y7RM6JfcX4ASSNBkrkrmSbRu431YVi9Y3oLFnzC2dCh',
      authWalletAddress: '5hr5fisPi6DXNuuRpm5XUbzpiEnmdyxXuBDTwzwZj5Pe',
    });
    jsonTx.instructionsData.should.deepEqual([
      {
        type: 'Transfer',
        params: {
          fromAddress: '5hr5fisPi6DXNuuRpm5XUbzpiEnmdyxXuBDTwzwZj5Pe',
          toAddress: 'CP5Dpaa42RtJmMuKqCQsLwma5Yh3knuvKsYDFX85F41S',
          amount: '300000',
        },
      },
      {
        type: 'Memo',
        params: { memo: 'test memo' },
      },
    ]);
    builtTx.toBroadcastFormat().should.equal(testData.TRANSFER_SIGNED_TX_WITH_MEMO_AND_DURABLE_NONCE);
  });

  describe('Nonce tests', async () => {
    it('should throw for invalid nonce', () => {
      const blockHash = 'randomstring';
      for (const txBuilder of builders) {
        should(() => txBuilder.nonce(blockHash)).throw('Invalid or missing blockHash, got: ' + blockHash);
      }
    });

    it('should throw for invalid params using durable nonce', () => {
      const invalidPubKey = 'randomstring';
      for (const txBuilder of builders) {
        should(() =>
          txBuilder.nonce(validBlockhash, {
            walletNonceAddress: invalidPubKey,
            authWalletAddress: authAccount.pub,
          }),
        ).throw('Invalid or missing walletNonceAddress, got: ' + invalidPubKey);

        should(() =>
          txBuilder.nonce(validBlockhash, {
            walletNonceAddress: nonceAccount.pub,
            authWalletAddress: invalidPubKey,
          }),
        ).throw('Invalid or missing authWalletAddress, got: ' + invalidPubKey);

        should(() =>
          txBuilder.nonce(validBlockhash, {
            walletNonceAddress: nonceAccount.pub,
            authWalletAddress: nonceAccount.pub,
          }),
        ).throw('Invalid params: walletNonceAddress cannot be equal to authWalletAddress');
      }
    });

    it('should succeed for valid nonce', () => {
      for (const txBuilder of builders) {
        should.doesNotThrow(() => txBuilder.nonce(validBlockhash));
      }
    });

    it('should succeed for valid durable nonce', () => {
      for (const txBuilder of builders) {
        should.doesNotThrow(() =>
          txBuilder.nonce(validBlockhash, { walletNonceAddress: nonceAccount.pub, authWalletAddress: authAccount.pub }),
        );
      }
    });
  });

  describe('sender tests', async () => {
    it('should throw for invalid sender', () => {
      const invalidPublicKey = 'randomstring';
      for (const txBuilder of builders) {
        should(() => txBuilder.sender(invalidPublicKey)).throw('Invalid or missing sender, got: ' + invalidPublicKey);
      }
    });
    it('should succeed for valid sender', () => {
      for (const txBuilder of builders) {
        should.doesNotThrow(() => txBuilder.sender(authAccount.pub));
      }
    });
  });

  it('validateAddress', () => {
    const validAddress = { address: authAccount.pub };
    const invalidAddress = { address: testData.pubKeys.invalidPubKeys[0] };
    for (const builder of builders) {
      should.doesNotThrow(() => builder.validateAddress(validAddress));
      should(() => builder.validateAddress(invalidAddress)).throwError(
        'Invalid address ' + testData.pubKeys.invalidPubKeys[0],
      );
    }
  });

  it('validateKey', () => {
    const validKey = { key: testData.authAccount.prv };
    const invalidKey = { key: testData.authAccount.pub };
    for (const builder of builders) {
      should.doesNotThrow(() => builder.validateKey(validKey));
      should(() => builder.validateKey(invalidKey)).throwError('Invalid key');
    }
  });

  it('validateRawTransaction', () => {
    const validRawTx = testData.RAW_TX_SIGNED;
    const invalidRawTx = 'AAAAAAAAAAAAAAAAAAA';
    for (const builder of builders) {
      should.doesNotThrow(() => builder.validateRawTransaction(validRawTx));
      should(() => builder.validateRawTransaction(invalidRawTx)).throwError('Invalid raw transaction');
    }
  });

  it('validateValue', () => {
    const validValue = new BigNumber('100000');
    const invalidValue = new BigNumber('-100000');
    for (const builder of builders) {
      should.doesNotThrow(() => builder.validateValue(validValue));
      should(() => builder.validateValue(invalidValue)).throwError('Value cannot be less than zero');
    }
  });

  it('validateMemo', () => {
    const validMemo = 'test memo';
    const invalidMemo =
      'ooawindaonmawñdamwdoianwdonalskdnaiouwbdoinowadn90awndoawndaowdnaioiuwbdioauwndaoudnbawodnba9owudbnaowdna';
    for (const builder of builders) {
      builder._instructionsData.push({
        type: 'Transfer',
        params: {
          fromAddress: '5hr5fisPi6DXNuuRpm5XUbzpiEnmdyxXuBDTwzwZj5Pe',
          toAddress: 'CP5Dpaa42RtJmMuKqCQsLwma5Yh3knuvKsYDFX85F41S',
          amount: '300000',
        },
      });
      builder.validateMemo(validMemo);
      should(() => builder.validateMemo(invalidMemo)).throwError('Memo is too long');
      should((memo: string) => builder.validateMemo(memo)).throwError('Invalid memo, got: undefined');
    }
  });
});
