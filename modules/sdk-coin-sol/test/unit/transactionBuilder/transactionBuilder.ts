import should from 'should';
import * as bs58 from 'bs58';

import { getBuilderFactory } from '../getBuilderFactory';
import { KeyPair } from '../../../src';
import { Eddsa, TransactionType } from '@bitgo/sdk-core';
import * as testData from '../../resources/sol';
import BigNumber from 'bignumber.js';
import { Ed25519Bip32HdTree } from '@bitgo/sdk-lib-mpc';

describe('Sol Transaction Builder', async () => {
  let builders;
  const factory = getBuilderFactory('tsol');
  const authAccount = new KeyPair(testData.authAccount).getKeys();
  const nonceAccount = new KeyPair(testData.nonceAccount).getKeys();
  const validBlockhash = 'GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi';

  beforeEach(function (done) {
    builders = [
      factory.getWalletInitializationBuilder(),
      factory.getTransferBuilder(),
      factory.getStakingActivateBuilder(),
      factory.getStakingWithdrawBuilder(),
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
    should.equal(builtTx.id, '7TkU8wLgXDeLFbVydtg6mqMsp9GatsetitSngysgjxFhofKSUcLPBoKPHciLeGEfJFMsqezpZmGRSFQTBy7ZDsg');
    builtTx.inputs.length.should.equal(1);
    builtTx.inputs[0].should.deepEqual({
      address: '5hr5fisPi6DXNuuRpm5XUbzpiEnmdyxXuBDTwzwZj5Pe',
      value: testData.tokenTransfers.amount.toString(),
      coin: 'tsol',
    });
    builtTx.outputs.length.should.equal(0);
    const jsonTx = builtTx.toJson();
    jsonTx.id.should.equal('7TkU8wLgXDeLFbVydtg6mqMsp9GatsetitSngysgjxFhofKSUcLPBoKPHciLeGEfJFMsqezpZmGRSFQTBy7ZDsg');
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
    should.equal(builtTx.id, 'DCsSiGuKiWgtFRF2ZCh5x6xukApffYDs5Y9CyvYBEebMVnXH5TydKpT76srTSr1AhvDZqsnS5EVhvkS8Rzh91hH');
    builtTx.inputs.length.should.equal(1);
    builtTx.inputs[0].should.deepEqual({
      address: '5hr5fisPi6DXNuuRpm5XUbzpiEnmdyxXuBDTwzwZj5Pe',
      value: testData.tokenTransfers.amount.toString(),
      coin: 'tsol',
    });
    builtTx.outputs.length.should.equal(1);
    const jsonTx = builtTx.toJson();
    jsonTx.id.should.equal('DCsSiGuKiWgtFRF2ZCh5x6xukApffYDs5Y9CyvYBEebMVnXH5TydKpT76srTSr1AhvDZqsnS5EVhvkS8Rzh91hH');
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
      '2XFxGfXddKWnqGaMAsfNL8HgXqDvjBL2Ae28KWrRvg9bQBmCrpHYVDacuZFeAUyYwjXG6ey2jTARX5VQCnj7SF4L'
    );
    builtTx.inputs.length.should.equal(1);
    builtTx.inputs[0].should.deepEqual({
      address: '5hr5fisPi6DXNuuRpm5XUbzpiEnmdyxXuBDTwzwZj5Pe',
      value: testData.tokenTransfers.amount.toString(),
      coin: 'tsol',
    });
    builtTx.outputs.length.should.equal(1);
    builtTx.outputs[0].should.deepEqual({
      address: 'CP5Dpaa42RtJmMuKqCQsLwma5Yh3knuvKsYDFX85F41S',
      value: testData.tokenTransfers.amount.toString(),
      coin: 'tsol',
    });
    const jsonTx = builtTx.toJson();
    jsonTx.id.should.equal('2XFxGfXddKWnqGaMAsfNL8HgXqDvjBL2Ae28KWrRvg9bQBmCrpHYVDacuZFeAUyYwjXG6ey2jTARX5VQCnj7SF4L');
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

  it('build a send from raw token transaction', async () => {
    const txBuilder = factory.from(testData.TOKEN_TRANSFER_SIGNED_TX_WITH_MEMO_AND_DURABLE_NONCE);
    const builtTx = await txBuilder.build();
    should.equal(builtTx.type, TransactionType.Send);
    should.equal(
      builtTx.id,
      '335sxAuVj5ucXqVWW82QwpFLArPbdD3gXfXr4KrxkLkUpmLB3Nwz2G82z2TqiDD7mNAAbHkcAqD5ycDZp1vVKtjf'
    );
    builtTx.inputs.length.should.equal(1);
    builtTx.inputs[0].should.deepEqual({
      address: testData.associatedTokenAccounts.accounts[0].pub,
      value: testData.tokenTransfers.amount.toString(),
      coin: 'tsol:usdc',
    });
    builtTx.outputs.length.should.equal(1);
    builtTx.outputs[0].should.deepEqual({
      address: 'CP5Dpaa42RtJmMuKqCQsLwma5Yh3knuvKsYDFX85F41S',
      value: testData.tokenTransfers.amount.toString(),
      coin: 'tsol:usdc',
    });
    const jsonTx = builtTx.toJson();
    jsonTx.id.should.equal('335sxAuVj5ucXqVWW82QwpFLArPbdD3gXfXr4KrxkLkUpmLB3Nwz2G82z2TqiDD7mNAAbHkcAqD5ycDZp1vVKtjf');
    jsonTx.feePayer.should.equal(testData.associatedTokenAccounts.accounts[0].pub);
    jsonTx.nonce.should.equal('GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi');
    jsonTx.numSignatures.should.equal(1);
    jsonTx.durableNonce.should.deepEqual({
      walletNonceAddress: '8Y7RM6JfcX4ASSNBkrkrmSbRu431YVi9Y3oLFnzC2dCh',
      authWalletAddress: testData.associatedTokenAccounts.accounts[0].pub,
    });
    jsonTx.instructionsData.should.deepEqual([
      {
        type: 'TokenTransfer',
        params: {
          fromAddress: testData.associatedTokenAccounts.accounts[0].pub,
          toAddress: 'CP5Dpaa42RtJmMuKqCQsLwma5Yh3knuvKsYDFX85F41S',
          amount: testData.tokenTransfers.amount.toString(),
          tokenName: testData.tokenTransfers.nameUSDC.toString(),
          sourceAddress: 'B5rJjuVi7En63iK6o3ijKdJwAoTe2gwCYmJsVdHQ2aKV',
        },
      },
      {
        type: 'Memo',
        params: { memo: 'test memo' },
      },
    ]);
    builtTx.toBroadcastFormat().should.equal(testData.TOKEN_TRANSFER_SIGNED_TX_WITH_MEMO_AND_DURABLE_NONCE);
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
          })
        ).throw('Invalid or missing walletNonceAddress, got: ' + invalidPubKey);

        should(() =>
          txBuilder.nonce(validBlockhash, {
            walletNonceAddress: nonceAccount.pub,
            authWalletAddress: invalidPubKey,
          })
        ).throw('Invalid or missing authWalletAddress, got: ' + invalidPubKey);

        should(() =>
          txBuilder.nonce(validBlockhash, {
            walletNonceAddress: nonceAccount.pub,
            authWalletAddress: nonceAccount.pub,
          })
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
          txBuilder.nonce(validBlockhash, { walletNonceAddress: nonceAccount.pub, authWalletAddress: authAccount.pub })
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
        'Invalid address ' + testData.pubKeys.invalidPubKeys[0]
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

  describe('add signature', () => {
    let MPC: Eddsa;

    it('should add signature to transaction', async () => {
      const transferBuilder = factory
        .getTransferBuilder()
        .sender(authAccount.pub)
        .nonce(validBlockhash)
        .fee({ amount: 5000 })
        .send({ address: nonceAccount.pub, amount: '1000' });
      transferBuilder.sign({ key: authAccount.prv });

      const signedTransaction = await transferBuilder.build();
      // signature is base58 encoded
      const signature = signedTransaction.signature[0];

      // verify rebuilt transaction contains signature
      const rawTransaction = signedTransaction.toBroadcastFormat() as string;
      const rebuiltSignedTransaction = await factory.from(rawTransaction).build();
      rebuiltSignedTransaction.signature.should.deepEqual(signedTransaction.signature);

      const transferBuilder2 = factory
        .getTransferBuilder()
        .sender(authAccount.pub)
        .nonce(validBlockhash)
        .fee({ amount: 5000 })
        .send({ address: nonceAccount.pub, amount: '1000' });
      transferBuilder2.addSignature({ pub: authAccount.pub }, Buffer.from(bs58.decode(signature)));
      const signedTransaction2 = await transferBuilder2.build();

      // verify signatures are correct
      signedTransaction.signature.should.deepEqual(signedTransaction2.signature);

      // verify rebuilt transaction contains signature
      const rawTransaction2 = signedTransaction2.toBroadcastFormat() as string;
      const rebuiltTransaction2 = await factory.from(rawTransaction2).build();
      rebuiltTransaction2.signature.should.deepEqual(signedTransaction2.signature);
    });

    before('initialize mpc module', async () => {
      const hdTree = await Ed25519Bip32HdTree.initialize();
      MPC = await Eddsa.initialize(hdTree);
    });

    it('should add TSS signature', async () => {
      const A = MPC.keyShare(1, 2, 3);
      const B = MPC.keyShare(2, 2, 3);
      const C = MPC.keyShare(3, 2, 3);

      const A_combine = MPC.keyCombine(A.uShare, [B.yShares[1], C.yShares[1]]);
      const B_combine = MPC.keyCombine(B.uShare, [A.yShares[2], C.yShares[2]]);
      const C_combine = MPC.keyCombine(C.uShare, [A.yShares[3], B.yShares[3]]);

      const commonPub = A_combine.pShare.y;
      const solPublicKey = new KeyPair({ pub: commonPub });
      const sender = solPublicKey.getAddress();

      let transferBuilder = factory
        .getTransferBuilder()
        .sender(sender)
        .nonce(validBlockhash)
        .fee({ amount: 5000 })
        .send({ address: nonceAccount.pub, amount: '1000' });
      const unsignedTransaction = await transferBuilder.build();
      const signablePayload = unsignedTransaction.signablePayload;

      // signing with A and B
      let A_sign_share = MPC.signShare(signablePayload, A_combine.pShare, [A_combine.jShares[2]]);
      let B_sign_share = MPC.signShare(signablePayload, B_combine.pShare, [B_combine.jShares[1]]);
      let A_sign = MPC.sign(signablePayload, A_sign_share.xShare, [B_sign_share.rShares[1]], [C.yShares[1]]);
      let B_sign = MPC.sign(signablePayload, B_sign_share.xShare, [A_sign_share.rShares[2]], [C.yShares[2]]);
      let signature = MPC.signCombine([A_sign, B_sign]);
      let rawSignature = Buffer.concat([Buffer.from(signature.R, 'hex'), Buffer.from(signature.sigma, 'hex')]);

      transferBuilder = factory
        .getTransferBuilder()
        .sender(sender)
        .nonce(validBlockhash)
        .fee({ amount: 5000 })
        .send({ address: nonceAccount.pub, amount: '1000' });
      transferBuilder.addSignature({ pub: sender }, rawSignature);
      let signedTransaction = await transferBuilder.build();
      signedTransaction.signature.length.should.equal(1);
      signedTransaction.signature[0].should.equal(bs58.encode(rawSignature));
      signedTransaction.id.should.equal(bs58.encode(rawSignature));

      // signing with A and C
      A_sign_share = MPC.signShare(signablePayload, A_combine.pShare, [A_combine.jShares[3]]);
      let C_sign_share = MPC.signShare(signablePayload, C_combine.pShare, [C_combine.jShares[1]]);
      A_sign = MPC.sign(signablePayload, A_sign_share.xShare, [C_sign_share.rShares[1]], [B.yShares[1]]);
      let C_sign = MPC.sign(signablePayload, C_sign_share.xShare, [A_sign_share.rShares[3]], [B.yShares[3]]);
      signature = MPC.signCombine([A_sign, C_sign]);
      rawSignature = Buffer.concat([Buffer.from(signature.R, 'hex'), Buffer.from(signature.sigma, 'hex')]);

      transferBuilder = factory
        .getTransferBuilder()
        .sender(sender)
        .nonce(validBlockhash)
        .fee({ amount: 5000 })
        .send({ address: nonceAccount.pub, amount: '1000' });
      transferBuilder.addSignature({ pub: sender }, rawSignature);
      signedTransaction = await transferBuilder.build();
      signedTransaction.signature.length.should.equal(1);
      signedTransaction.signature[0].should.equal(bs58.encode(rawSignature));
      signedTransaction.id.should.equal(bs58.encode(rawSignature));

      // signing with B and C
      B_sign_share = MPC.signShare(signablePayload, B_combine.pShare, [B_combine.jShares[3]]);
      C_sign_share = MPC.signShare(signablePayload, C_combine.pShare, [C_combine.jShares[2]]);
      B_sign = MPC.sign(signablePayload, B_sign_share.xShare, [C_sign_share.rShares[2]], [A.yShares[2]]);
      C_sign = MPC.sign(signablePayload, C_sign_share.xShare, [B_sign_share.rShares[3]], [A.yShares[3]]);
      signature = MPC.signCombine([B_sign, C_sign]);
      rawSignature = Buffer.concat([Buffer.from(signature.R, 'hex'), Buffer.from(signature.sigma, 'hex')]);

      transferBuilder = factory
        .getTransferBuilder()
        .sender(sender)
        .nonce(validBlockhash)
        .fee({ amount: 5000 })
        .send({ address: nonceAccount.pub, amount: '1000' });
      transferBuilder.addSignature({ pub: sender }, rawSignature);
      signedTransaction = await transferBuilder.build();
      signedTransaction.signature.length.should.equal(1);
      signedTransaction.signature[0].should.equal(bs58.encode(rawSignature));
      signedTransaction.id.should.equal(bs58.encode(rawSignature));

      const rawTransaction = signedTransaction.toBroadcastFormat() as string;
      const rebuiltTransaction = await factory.from(rawTransaction).build();
      rebuiltTransaction.id.should.equal(signedTransaction.id);
      rebuiltTransaction.signature.should.deepEqual(signedTransaction.signature);
    });

    it('should add TSS HD signature', async () => {
      const A = MPC.keyShare(1, 2, 3);
      const B = MPC.keyShare(2, 2, 3);
      const C = MPC.keyShare(3, 2, 3);

      const A_combine = MPC.keyCombine(A.uShare, [B.yShares[1], C.yShares[1]]);
      const B_combine = MPC.keyCombine(B.uShare, [A.yShares[2], C.yShares[2]]);

      for (let index = 0; index < 10; index++) {
        const path = `m/${index}`;

        const A_subkey = MPC.keyDerive(A.uShare, [B.yShares[1], C.yShares[1]], path);
        const B_subkey = MPC.keyCombine(B.uShare, [A_subkey.yShares[2], C.yShares[2]]);

        const solPublicKey = new KeyPair({ pub: A_subkey.pShare.y });
        const sender = solPublicKey.getAddress();

        const transferBuilder = factory
          .getTransferBuilder()
          .sender(sender)
          .nonce(validBlockhash)
          .fee({ amount: 5000 })
          .send({ address: nonceAccount.pub, amount: '1000' });
        const unsignedTransaction = await transferBuilder.build();
        const signablePayload = unsignedTransaction.signablePayload;

        const A_sign_share = MPC.signShare(signablePayload, A_subkey.pShare, [A_combine.jShares[2]]);
        const B_sign_share = MPC.signShare(signablePayload, B_subkey.pShare, [B_combine.jShares[1]]);
        const A_sign = MPC.sign(signablePayload, A_sign_share.xShare, [B_sign_share.rShares[1]], [C.yShares[1]]);
        const B_sign = MPC.sign(signablePayload, B_sign_share.xShare, [A_sign_share.rShares[2]], [C.yShares[2]]);

        const signature = MPC.signCombine([A_sign, B_sign]);
        const rawSignature = Buffer.concat([Buffer.from(signature.R, 'hex'), Buffer.from(signature.sigma, 'hex')]);

        transferBuilder.addSignature({ pub: sender }, rawSignature);

        const signedTransaction = await transferBuilder.build();
        signedTransaction.signature.length.should.equal(1);
        signedTransaction.signature[0].should.equal(bs58.encode(rawSignature));
        signedTransaction.id.should.equal(bs58.encode(rawSignature));

        const rawTransaction = signedTransaction.toBroadcastFormat() as string;
        const rebuiltTransaction = await factory.from(rawTransaction).build();
        rebuiltTransaction.id.should.equal(signedTransaction.id);
        rebuiltTransaction.signature.should.deepEqual(signedTransaction.signature);
      }
    });
  });
});
