import { getBuilderFactory } from '../getBuilderFactory';
import { KeyPair, Utils } from '../../../src';
import should from 'should';
import * as testData from '../../resources/sol';

describe('Sol Token Transfer Builder', () => {
  let ataAddress;
  const factory = getBuilderFactory('tsol');

  const tokenTransferBuilder = () => {
    const txBuilder = factory.getTokenTransferBuilder();
    txBuilder.nonce(recentBlockHash);
    txBuilder.sender(authAccount.pub);
    return txBuilder;
  };

  const authAccount = new KeyPair(testData.authAccount).getKeys();
  const nonceAccount = new KeyPair(testData.nonceAccount).getKeys();
  const otherAccount = new KeyPair({ prv: testData.prvKeys.prvKey1.base58 }).getKeys();
  const invalidPubKey = testData.pubKeys.invalidPubKeys[0];
  const recentBlockHash = 'GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi';
  const amount = testData.tokenTransfers.amount.toString();
  const memo = testData.tokenTransfers.memo;
  const nameUSDC = testData.tokenTransfers.nameUSDC;
  const mintUSDC = testData.tokenTransfers.mintUSDC;
  const owner = testData.tokenTransfers.owner;
  const walletPK = testData.associatedTokenAccounts.accounts[0].pub;
  const walletSK = testData.associatedTokenAccounts.accounts[0].prv;
  describe('Succeed', () => {
    before(async () => {
      ataAddress = await Utils.getAssociatedTokenAccountAddress(mintUSDC, otherAccount.pub);
    });

    it('build a token transfer tx unsigned with memo', async () => {
      const txBuilder = factory.getTokenTransferBuilder();
      txBuilder.nonce(recentBlockHash);
      txBuilder.sender(walletPK);
      txBuilder.send({ address: otherAccount.pub, amount, tokenName: nameUSDC });
      txBuilder.memo(memo);
      const tx = await txBuilder.build();
      tx.inputs.length.should.equal(1);
      tx.inputs[0].should.deepEqual({
        address: walletPK,
        value: amount,
        coin: nameUSDC,
      });
      tx.outputs.length.should.equal(1);
      tx.outputs[0].should.deepEqual({
        address: otherAccount.pub,
        value: amount,
        coin: nameUSDC,
      });
      const rawTx = tx.toBroadcastFormat();
      should.equal(Utils.isValidRawTransaction(rawTx), true);
      should.equal(rawTx, testData.TOKEN_TRANSFER_UNSIGNED_TX_WITH_MEMO);
    });

    it('build a token transfer tx unsigned with durable nonce', async () => {
      const txBuilder = factory.getTokenTransferBuilder();
      txBuilder.nonce(recentBlockHash, { walletNonceAddress: nonceAccount.pub, authWalletAddress: walletPK });
      txBuilder.sender(walletPK);
      txBuilder.send({ address: otherAccount.pub, amount, tokenName: nameUSDC });
      const tx = await txBuilder.build();
      tx.inputs.length.should.equal(1);
      tx.inputs[0].should.deepEqual({
        address: walletPK,
        value: amount,
        coin: nameUSDC,
      });
      tx.outputs.length.should.equal(1);
      tx.outputs[0].should.deepEqual({
        address: otherAccount.pub,
        value: amount,
        coin: nameUSDC,
      });
      const rawTx = tx.toBroadcastFormat();
      should.equal(Utils.isValidRawTransaction(rawTx), true);
      should.equal(rawTx, testData.TOKEN_TRANSFER_UNSIGNED_TX_WITH_DURABLE_NONCE);
      const txJson = tx.toJson();
      txJson.durableNonce.should.deepEqual({
        walletNonceAddress: nonceAccount.pub,
        authWalletAddress: walletPK,
      });
    });

    it('build a token transfer tx unsigned with memo and durable nonce', async () => {
      const txBuilder = factory.getTokenTransferBuilder();
      txBuilder.nonce(recentBlockHash, { walletNonceAddress: nonceAccount.pub, authWalletAddress: walletPK });
      txBuilder.sender(walletPK);
      txBuilder.send({ address: otherAccount.pub, amount, tokenName: nameUSDC });
      txBuilder.memo(memo);
      const tx = await txBuilder.build();
      tx.inputs.length.should.equal(1);
      tx.inputs[0].should.deepEqual({
        address: walletPK,
        value: amount,
        coin: nameUSDC,
      });
      tx.outputs.length.should.equal(1);
      tx.outputs[0].should.deepEqual({
        address: otherAccount.pub,
        value: amount,
        coin: nameUSDC,
      });
      const rawTx = tx.toBroadcastFormat();
      should.equal(Utils.isValidRawTransaction(rawTx), true);
      should.equal(rawTx, testData.TOKEN_TRANSFER_UNSIGNED_TX_WITH_MEMO_AND_DURABLE_NONCE);
    });

    it('build a token transfer tx unsigned without memo or durable nonce', async () => {
      const txBuilder = factory.getTokenTransferBuilder();
      txBuilder.nonce(recentBlockHash);
      txBuilder.sender(walletPK);
      txBuilder.send({ address: otherAccount.pub, amount, tokenName: nameUSDC });
      const tx = await txBuilder.build();
      tx.inputs.length.should.equal(1);
      tx.inputs[0].should.deepEqual({
        address: walletPK,
        value: amount,
        coin: nameUSDC,
      });
      tx.outputs.length.should.equal(1);
      tx.outputs[0].should.deepEqual({
        address: otherAccount.pub,
        value: amount,
        coin: nameUSDC,
      });
      const rawTx = tx.toBroadcastFormat();
      should.equal(Utils.isValidRawTransaction(rawTx), true);
      should.equal(rawTx, testData.TOKEN_TRANSFER_UNSIGNED_TX_WITHOUT_MEMO);
    });

    it('build a token transfer tx signed with memo and durable nonce', async () => {
      const txBuilder = factory.getTokenTransferBuilder();
      txBuilder.nonce(recentBlockHash, {
        walletNonceAddress: nonceAccount.pub,
        authWalletAddress: walletPK,
      });
      txBuilder.sender(walletPK);
      txBuilder.send({ address: otherAccount.pub, amount, tokenName: nameUSDC });
      txBuilder.memo(memo);
      txBuilder.sign({ key: walletSK });
      const tx = await txBuilder.build();
      tx.id.should.not.equal(undefined);
      tx.inputs.length.should.equal(1);
      tx.inputs[0].should.deepEqual({
        address: walletPK,
        value: amount,
        coin: nameUSDC,
      });
      tx.outputs.length.should.equal(1);
      tx.outputs[0].should.deepEqual({
        address: otherAccount.pub,
        value: amount,
        coin: nameUSDC,
      });
      const rawTx = tx.toBroadcastFormat();
      should.equal(Utils.isValidRawTransaction(rawTx), true);
      should.equal(rawTx, testData.TOKEN_TRANSFER_SIGNED_TX_WITH_MEMO_AND_DURABLE_NONCE);
    });

    it('build a token multi transfer tx signed with memo and durable nonce', async () => {
      const account1 = new KeyPair({ prv: testData.extraAccounts.prv1 }).getKeys();
      const account2 = new KeyPair({ prv: testData.extraAccounts.prv2 }).getKeys();
      const account3 = new KeyPair({ prv: testData.extraAccounts.prv3 }).getKeys();
      const account4 = new KeyPair({ prv: testData.extraAccounts.prv4 }).getKeys();
      const account5 = new KeyPair({ prv: testData.extraAccounts.prv5 }).getKeys();
      const txBuilder = factory.getTokenTransferBuilder();

      txBuilder.nonce(recentBlockHash, { walletNonceAddress: nonceAccount.pub, authWalletAddress: authAccount.pub });
      txBuilder.sender(owner);
      txBuilder.send({ address: otherAccount.pub, amount, tokenName: nameUSDC });
      txBuilder.send({ address: account1.pub, amount, tokenName: nameUSDC });
      txBuilder.send({ address: account2.pub, amount, tokenName: nameUSDC });
      txBuilder.send({ address: account3.pub, amount, tokenName: nameUSDC });
      txBuilder.send({ address: account4.pub, amount, tokenName: nameUSDC });
      txBuilder.send({ address: account5.pub, amount, tokenName: nameUSDC });
      txBuilder.memo(memo);
      txBuilder.sign({ key: authAccount.prv });
      const tx = await txBuilder.build();
      tx.inputs.length.should.equal(6);
      tx.inputs[0].should.deepEqual({
        address: owner,
        value: amount,
        coin: nameUSDC,
      });
      tx.inputs[1].should.deepEqual({
        address: owner,
        value: amount,
        coin: nameUSDC,
      });
      tx.inputs[2].should.deepEqual({
        address: owner,
        value: amount,
        coin: nameUSDC,
      });
      tx.inputs[3].should.deepEqual({
        address: owner,
        value: amount,
        coin: nameUSDC,
      });
      tx.inputs[4].should.deepEqual({
        address: owner,
        value: amount,
        coin: nameUSDC,
      });
      tx.inputs[5].should.deepEqual({
        address: owner,
        value: amount,
        coin: nameUSDC,
      });
      tx.outputs.length.should.equal(6);
      tx.outputs[0].should.deepEqual({
        address: otherAccount.pub,
        value: amount,
        coin: nameUSDC,
      });
      tx.outputs[1].should.deepEqual({
        address: account1.pub,
        value: amount,
        coin: nameUSDC,
      });
      tx.outputs[2].should.deepEqual({
        address: account2.pub,
        value: amount,
        coin: nameUSDC,
      });
      tx.outputs[3].should.deepEqual({
        address: account3.pub,
        value: amount,
        coin: nameUSDC,
      });
      tx.outputs[4].should.deepEqual({
        address: account4.pub,
        value: amount,
        coin: nameUSDC,
      });
      tx.outputs[5].should.deepEqual({
        address: account5.pub,
        value: amount,
        coin: nameUSDC,
      });
      const rawTx = tx.toBroadcastFormat();
      should.equal(Utils.isValidRawTransaction(rawTx), true);
      should.equal(rawTx, testData.MULTI_TOKEN_TRANSFER_SIGNED);
    });

    it('build a token multi asset transfer tx unsigned', async () => {
      const account1 = new KeyPair({ prv: testData.extraAccounts.prv1 }).getKeys();
      const account2 = new KeyPair({ prv: testData.extraAccounts.prv2 }).getKeys();
      const account3 = new KeyPair({ prv: testData.extraAccounts.prv3 }).getKeys();
      const txBuilder = factory.getTokenTransferBuilder();
      const nameSRM = 'tsol:srm';
      const nameRAY = 'tsol:ray';

      txBuilder.nonce(recentBlockHash);
      txBuilder.sender(owner);
      txBuilder.send({ address: otherAccount.pub, amount, tokenName: nameUSDC });
      txBuilder.send({ address: account1.pub, amount, tokenName: nameUSDC });
      txBuilder.send({ address: account2.pub, amount, tokenName: nameSRM });
      txBuilder.send({ address: account3.pub, amount, tokenName: nameRAY });
      const tx = await txBuilder.build();
      tx.inputs.length.should.equal(4);
      tx.inputs[0].should.deepEqual({
        address: owner,
        value: amount,
        coin: nameUSDC,
      });
      tx.inputs[1].should.deepEqual({
        address: owner,
        value: amount,
        coin: nameUSDC,
      });
      tx.inputs[2].should.deepEqual({
        address: owner,
        value: amount,
        coin: nameSRM,
      });
      tx.inputs[3].should.deepEqual({
        address: owner,
        value: amount,
        coin: nameRAY,
      });

      tx.outputs.length.should.equal(4);
      tx.outputs[0].should.deepEqual({
        address: otherAccount.pub,
        value: amount,
        coin: nameUSDC,
      });
      tx.outputs[1].should.deepEqual({
        address: account1.pub,
        value: amount,
        coin: nameUSDC,
      });
      tx.outputs[2].should.deepEqual({
        address: account2.pub,
        value: amount,
        coin: nameSRM,
      });
      tx.outputs[3].should.deepEqual({
        address: account3.pub,
        value: amount,
        coin: nameRAY,
      });

      const txJson = tx.toJson();
      txJson.instructionsData.length.should.equal(4);
      txJson.instructionsData[0].params.sourceAddress.should.equal(testData.tokenTransfers.sourceUSDC);
      txJson.instructionsData[1].params.sourceAddress.should.equal(testData.tokenTransfers.sourceUSDC);
      txJson.instructionsData[2].params.sourceAddress.should.equal(testData.tokenTransfers.sourceSRM);
      txJson.instructionsData[3].params.sourceAddress.should.equal(testData.tokenTransfers.sourceRAY);

      const rawTx = tx.toBroadcastFormat();
      should.equal(Utils.isValidRawTransaction(rawTx), true);
      should.equal(rawTx, testData.MULTI_ASSET_TOKEN_TRANSFER_UNSIGNED);
    });

    it('build a transfer with large amount', async () => {
      const amount = '18446744073709551615';
      const account1 = new KeyPair({ prv: testData.extraAccounts.prv1 }).getKeys();
      const txBuilder = factory.getTokenTransferBuilder();

      txBuilder.nonce(recentBlockHash);
      txBuilder.sender(owner);
      txBuilder.send({ address: account1.pub, amount, tokenName: nameUSDC });
      const tx = await txBuilder.build();

      tx.outputs.should.deepEqual([
        {
          address: account1.pub,
          value: amount,
          coin: nameUSDC,
        },
      ]);
    });

    it('build a token transfer tx unsigned with create ATA, memo and durable nonce', async () => {
      const txBuilder = factory.getTokenTransferBuilder();
      txBuilder.nonce(recentBlockHash, { walletNonceAddress: nonceAccount.pub, authWalletAddress: walletPK });
      txBuilder.sender(walletPK);
      txBuilder.send({ address: otherAccount.pub, amount, tokenName: nameUSDC });
      txBuilder.memo(memo);
      txBuilder.createAssociatedTokenAccount({ ownerAddress: otherAccount.pub, tokenName: nameUSDC });
      const tx = await txBuilder.build();
      tx.inputs.length.should.equal(1);
      tx.inputs[0].should.deepEqual({
        address: walletPK,
        value: amount,
        coin: nameUSDC,
      });
      tx.outputs.length.should.equal(1);
      tx.outputs[0].should.deepEqual({
        address: otherAccount.pub,
        value: amount,
        coin: nameUSDC,
      });
      const txJson = tx.toJson();
      txJson.instructionsData.length.should.equal(3);
      txJson.instructionsData[0].type.should.equal('CreateAssociatedTokenAccount');
      txJson.instructionsData[0].params.should.deepEqual({
        mintAddress: mintUSDC,
        ataAddress: ataAddress,
        ownerAddress: otherAccount.pub,
        payerAddress: walletPK,
        tokenName: nameUSDC,
      });
      txJson.instructionsData[1].type.should.equal('TokenTransfer');
      txJson.instructionsData[1].params.should.deepEqual({
        fromAddress: walletPK,
        toAddress: otherAccount.pub,
        amount: amount,
        tokenName: nameUSDC,
        sourceAddress: 'B5rJjuVi7En63iK6o3ijKdJwAoTe2gwCYmJsVdHQ2aKV',
      });
      txJson.instructionsData[2].type.should.equal('Memo');
      txJson.instructionsData[2].params.memo.should.equal(memo);

      const rawTx = tx.toBroadcastFormat();
      should.equal(Utils.isValidRawTransaction(rawTx), true);
      should.equal(rawTx, testData.TOKEN_TRANSFER_UNSIGNED_WITH_CREATE_ATA_AND_MEMO_AND_DURABLE_NONCE);
    });

    it('build a multi token transfer tx unsigned with multi create ATA, memo and durable nonce', async () => {
      const account1 = new KeyPair({ prv: testData.extraAccounts.prv1 }).getKeys();
      const account2 = new KeyPair({ prv: testData.extraAccounts.prv2 }).getKeys();
      const ataAddress1 = await Utils.getAssociatedTokenAccountAddress(mintUSDC, account1.pub);
      const ataAddress2 = await Utils.getAssociatedTokenAccountAddress(mintUSDC, account2.pub);

      const txBuilder = factory.getTokenTransferBuilder();
      txBuilder.sender(walletPK);
      txBuilder.nonce(recentBlockHash, { walletNonceAddress: nonceAccount.pub, authWalletAddress: walletPK });
      txBuilder.send({ address: otherAccount.pub, amount, tokenName: nameUSDC });
      txBuilder.send({ address: account1.pub, amount, tokenName: nameUSDC });
      txBuilder.send({ address: account2.pub, amount, tokenName: nameUSDC });
      txBuilder.memo(memo);
      txBuilder.createAssociatedTokenAccount({ ownerAddress: otherAccount.pub, tokenName: nameUSDC });
      txBuilder.createAssociatedTokenAccount({ ownerAddress: account1.pub, tokenName: nameUSDC });
      txBuilder.createAssociatedTokenAccount({ ownerAddress: account2.pub, tokenName: nameUSDC });
      const tx = await txBuilder.build();
      tx.inputs.length.should.equal(3);
      tx.inputs[0].should.deepEqual({
        address: walletPK,
        value: amount,
        coin: nameUSDC,
      });
      tx.inputs[1].should.deepEqual({
        address: walletPK,
        value: amount,
        coin: nameUSDC,
      });
      tx.inputs[2].should.deepEqual({
        address: walletPK,
        value: amount,
        coin: nameUSDC,
      });
      tx.outputs.length.should.equal(3);
      tx.outputs[0].should.deepEqual({
        address: otherAccount.pub,
        value: amount,
        coin: nameUSDC,
      });
      tx.outputs[1].should.deepEqual({
        address: account1.pub,
        value: amount,
        coin: nameUSDC,
      });
      tx.outputs[2].should.deepEqual({
        address: account2.pub,
        value: amount,
        coin: nameUSDC,
      });
      const txJson = tx.toJson();
      txJson.instructionsData.length.should.equal(7);
      txJson.instructionsData[0].type.should.equal('CreateAssociatedTokenAccount');
      txJson.instructionsData[0].params.should.deepEqual({
        mintAddress: mintUSDC,
        ataAddress: ataAddress,
        ownerAddress: otherAccount.pub,
        payerAddress: walletPK,
        tokenName: nameUSDC,
      });
      txJson.instructionsData[1].type.should.equal('CreateAssociatedTokenAccount');
      txJson.instructionsData[1].params.should.deepEqual({
        mintAddress: mintUSDC,
        ataAddress: ataAddress1,
        ownerAddress: account1.pub,
        payerAddress: walletPK,
        tokenName: nameUSDC,
      });
      txJson.instructionsData[2].type.should.equal('CreateAssociatedTokenAccount');
      txJson.instructionsData[2].params.should.deepEqual({
        mintAddress: mintUSDC,
        ataAddress: ataAddress2,
        ownerAddress: account2.pub,
        payerAddress: walletPK,
        tokenName: nameUSDC,
      });
      txJson.instructionsData.length.should.equal(7);
      txJson.instructionsData[3].type.should.equal('TokenTransfer');
      txJson.instructionsData[3].params.should.deepEqual({
        fromAddress: walletPK,
        toAddress: otherAccount.pub,
        amount: amount,
        tokenName: nameUSDC,
        sourceAddress: 'B5rJjuVi7En63iK6o3ijKdJwAoTe2gwCYmJsVdHQ2aKV',
      });
      txJson.instructionsData[4].type.should.equal('TokenTransfer');
      txJson.instructionsData[4].params.should.deepEqual({
        fromAddress: walletPK,
        toAddress: account1.pub,
        amount: amount,
        tokenName: nameUSDC,
        sourceAddress: 'B5rJjuVi7En63iK6o3ijKdJwAoTe2gwCYmJsVdHQ2aKV',
      });
      txJson.instructionsData[5].type.should.equal('TokenTransfer');
      txJson.instructionsData[5].params.should.deepEqual({
        fromAddress: walletPK,
        toAddress: account2.pub,
        amount: amount,
        tokenName: nameUSDC,
        sourceAddress: 'B5rJjuVi7En63iK6o3ijKdJwAoTe2gwCYmJsVdHQ2aKV',
      });
      txJson.instructionsData[6].type.should.equal('Memo');
      txJson.instructionsData[6].params.memo.should.equal(memo);

      const rawTx = tx.toBroadcastFormat();
      should.equal(Utils.isValidRawTransaction(rawTx), true);
      should.equal(rawTx, testData.MULTI_TOKEN_TRANSFER_UNSIGNED_WITH_MULTI_CREATE_ATA_AND_MEMO_AND_DURABLE_NONCE);
    });

    it('build a multi token transfer tx unsigned with unique create ATA, memo and durable nonce', async () => {
      const txBuilder = factory.getTokenTransferBuilder();
      txBuilder.sender(walletPK);
      txBuilder.nonce(recentBlockHash, { walletNonceAddress: nonceAccount.pub, authWalletAddress: walletPK });
      txBuilder.send({ address: otherAccount.pub, amount, tokenName: nameUSDC });
      txBuilder.send({ address: otherAccount.pub, amount, tokenName: nameUSDC });
      txBuilder.send({ address: otherAccount.pub, amount, tokenName: nameUSDC });
      txBuilder.memo(memo);
      txBuilder.createAssociatedTokenAccount({ ownerAddress: otherAccount.pub, tokenName: nameUSDC });
      txBuilder.createAssociatedTokenAccount({ ownerAddress: otherAccount.pub, tokenName: nameUSDC });
      txBuilder.createAssociatedTokenAccount({ ownerAddress: otherAccount.pub, tokenName: nameUSDC });
      const tx = await txBuilder.build();
      tx.inputs.length.should.equal(3);
      tx.inputs[0].should.deepEqual({
        address: walletPK,
        value: amount,
        coin: nameUSDC,
      });
      tx.inputs[1].should.deepEqual({
        address: walletPK,
        value: amount,
        coin: nameUSDC,
      });
      tx.inputs[2].should.deepEqual({
        address: walletPK,
        value: amount,
        coin: nameUSDC,
      });
      tx.outputs.length.should.equal(3);
      tx.outputs[0].should.deepEqual({
        address: otherAccount.pub,
        value: amount,
        coin: nameUSDC,
      });
      tx.outputs[1].should.deepEqual({
        address: otherAccount.pub,
        value: amount,
        coin: nameUSDC,
      });
      tx.outputs[2].should.deepEqual({
        address: otherAccount.pub,
        value: amount,
        coin: nameUSDC,
      });
      const txJson = tx.toJson();
      txJson.instructionsData.length.should.equal(5);
      txJson.instructionsData[0].type.should.equal('CreateAssociatedTokenAccount');
      txJson.instructionsData[0].params.should.deepEqual({
        mintAddress: mintUSDC,
        ataAddress: ataAddress,
        ownerAddress: otherAccount.pub,
        payerAddress: walletPK,
        tokenName: nameUSDC,
      });
      txJson.instructionsData[1].type.should.equal('TokenTransfer');
      txJson.instructionsData[1].params.should.deepEqual({
        fromAddress: walletPK,
        toAddress: otherAccount.pub,
        amount: amount,
        tokenName: nameUSDC,
        sourceAddress: 'B5rJjuVi7En63iK6o3ijKdJwAoTe2gwCYmJsVdHQ2aKV',
      });
      txJson.instructionsData[2].type.should.equal('TokenTransfer');
      txJson.instructionsData[2].params.should.deepEqual({
        fromAddress: walletPK,
        toAddress: otherAccount.pub,
        amount: amount,
        tokenName: nameUSDC,
        sourceAddress: 'B5rJjuVi7En63iK6o3ijKdJwAoTe2gwCYmJsVdHQ2aKV',
      });
      txJson.instructionsData[3].type.should.equal('TokenTransfer');
      txJson.instructionsData[3].params.should.deepEqual({
        fromAddress: walletPK,
        toAddress: otherAccount.pub,
        amount: amount,
        tokenName: nameUSDC,
        sourceAddress: 'B5rJjuVi7En63iK6o3ijKdJwAoTe2gwCYmJsVdHQ2aKV',
      });
      txJson.instructionsData[4].type.should.equal('Memo');
      txJson.instructionsData[4].params.memo.should.equal(memo);

      const rawTx = tx.toBroadcastFormat();
      should.equal(Utils.isValidRawTransaction(rawTx), true);
      should.equal(rawTx, testData.MULTI_TOKEN_TRANSFER_UNSIGNED_WITH_UNIQUE_CREATE_ATA_AND_MEMO_AND_DURABLE_NONCE);
    });
  });
  describe('Fail', () => {
    it('for invalid sender', () => {
      const txBuilder = tokenTransferBuilder();
      should(() => txBuilder.sender(invalidPubKey)).throwError('Invalid or missing sender, got: ' + invalidPubKey);
    });

    it('for invalid toAddress', () => {
      const txBuilder = tokenTransferBuilder();
      should(() => txBuilder.send({ address: invalidPubKey, amount, tokenName: nameUSDC })).throwError(
        'Invalid or missing address, got: ' + invalidPubKey
      );
    });

    it('for invalid amount', () => {
      const invalidAmount = 'randomstring';
      const txBuilder = tokenTransferBuilder();
      should(() =>
        txBuilder.send({
          address: nonceAccount.pub,
          amount: invalidAmount,
          tokenName: nameUSDC,
        })
      ).throwError('Invalid or missing amount, got: ' + invalidAmount);

      const excessiveAmount = '18446744073709551616';
      should(() =>
        txBuilder.send({
          address: nonceAccount.pub,
          amount: excessiveAmount,
          tokenName: nameUSDC,
        })
      ).throwError(`input amount ${excessiveAmount} exceeds big int limit 18446744073709551615`);
    });

    it('for invalid rent amount', () => {
      const invalidAmount = 'randomstring';
      const txBuilder = tokenTransferBuilder();
      should(() => txBuilder.associatedTokenAccountRent(invalidAmount)).throwError(
        'Invalid tokenAccountRentExemptAmount, got: ' + invalidAmount
      );

      const negativeAmount = '-111';
      should(() => txBuilder.associatedTokenAccountRent(negativeAmount)).throwError(
        'Invalid tokenAccountRentExemptAmount, got: ' + negativeAmount
      );
    });

    it('for invalid ownerAddress', () => {
      const txBuilder = tokenTransferBuilder();
      should(() =>
        txBuilder.createAssociatedTokenAccount({ ownerAddress: invalidPubKey, tokenName: nameUSDC })
      ).throwError('Invalid or missing ownerAddress, got: ' + invalidPubKey);
    });

    it('for invalid tokenName', () => {
      const invalidTokenName = 'tsol:random';
      const txBuilder = tokenTransferBuilder();
      should(() =>
        txBuilder.createAssociatedTokenAccount({ ownerAddress: nonceAccount.pub, tokenName: invalidTokenName })
      ).throwError('Invalid token name, got: ' + invalidTokenName);
    });
  });
});
