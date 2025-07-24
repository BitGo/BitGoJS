import { getBuilderFactory } from '../getBuilderFactory';
import { KeyPair, Utils } from '../../../src';
import * as testData from '../../resources/sol';
import should from 'should';
import { FeeOptions } from '@bitgo/sdk-core';
import { clusterApiUrl, Connection } from '@solana/web3.js';
// import * as bs58 from 'bs58';

describe('Sol Transfer Builder V2', () => {
  let ataAddress;
  const factory = getBuilderFactory('tsol');

  async function getLatestBlockhash(): Promise<string> {
    try {
      const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
      const { blockhash } = await connection.getLatestBlockhash();
      return blockhash;
    } catch (error) {
      // Fallback to hardcoded value if network call fails
      return 'GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi';
    }
  }

  const authAccount = new KeyPair(testData.authAccount).getKeys();
  const nonceAccount = new KeyPair(testData.nonceAccount).getKeys();
  const otherAccount = new KeyPair({ prv: testData.prvKeys.prvKey1.base58 }).getKeys();
  const feePayerAccount = new KeyPair(testData.feePayerAccount).getKeys();
  const invalidPubKey = testData.pubKeys.invalidPubKeys[0];
  const recentBlockHash = 'GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi';
  const amount = '300000';
  const memo = 'test memo';
  const nameUSDC = testData.tokenTransfers.nameUSDC;
  const mintUSDC = testData.tokenTransfers.mintUSDC;
  const nameAMS = testData.amsTokenTransfers.nameAMSToken;
  const mintAMS = testData.amsTokenTransfers.mintAMS;
  const amsProgramID = testData.amsTokenTransfers.programID;
  const owner = testData.tokenTransfers.owner;
  const walletPK = testData.associatedTokenAccounts.accounts[0].pub;
  const walletSK = testData.associatedTokenAccounts.accounts[0].prv;
  const prioFeeMicroLamports = '10000000';
  const priorityFee: FeeOptions = {
    amount: prioFeeMicroLamports,
  };
  const transferBuilderV2 = () => {
    const txBuilder = factory.getTransferBuilderV2();
    txBuilder.nonce(recentBlockHash);
    txBuilder.sender(authAccount.pub);
    return txBuilder;
  };

  describe('Succeed Native Transfer', () => {
    it('build a transfer tx unsigned with memo', async () => {
      const txBuilder = factory.getTransferBuilderV2();
      txBuilder.nonce(recentBlockHash);
      txBuilder.feePayer(feePayerAccount.pub);
      txBuilder.sender(authAccount.pub);
      txBuilder.send({ address: otherAccount.pub, amount });
      txBuilder.memo(memo);
      const tx = await txBuilder.build();
      tx.inputs.length.should.equal(1);
      tx.inputs[0].should.deepEqual({
        address: authAccount.pub,
        value: amount,
        coin: 'tsol',
      });
      tx.outputs.length.should.equal(1);
      tx.outputs[0].should.deepEqual({
        address: otherAccount.pub,
        value: amount,
        coin: 'tsol',
      });
      const rawTx = tx.toBroadcastFormat();
      should.equal(Utils.isValidRawTransaction(rawTx), true);
      should.equal(rawTx, testData.NATIVE_TRANSFERV2_UNSIGNED_WITH_MEMO);
      const reserialized = await factory.from(rawTx).build();
      // reserialized.should.be.deepEqual(tx); // we have extra param _useTokenAddressTokenName for factory.from method
      reserialized.toBroadcastFormat().should.equal(rawTx);
    });
    it('build a transfer tx unsigned with durable nonce', async () => {
      const txBuilder = factory.getTransferBuilderV2();
      txBuilder.nonce(recentBlockHash, { walletNonceAddress: nonceAccount.pub, authWalletAddress: authAccount.pub });
      txBuilder.feePayer(feePayerAccount.pub);
      txBuilder.sender(authAccount.pub);
      txBuilder.send({ address: otherAccount.pub, amount });
      const tx = await txBuilder.build();
      tx.inputs.length.should.equal(1);
      tx.inputs[0].should.deepEqual({
        address: authAccount.pub,
        value: amount,
        coin: 'tsol',
      });
      tx.outputs.length.should.equal(1);
      tx.outputs[0].should.deepEqual({
        address: otherAccount.pub,
        value: amount,
        coin: 'tsol',
      });
      const rawTx = tx.toBroadcastFormat();
      should.equal(Utils.isValidRawTransaction(rawTx), true);
      should.equal(rawTx, testData.NATIVE_TRANSFERV2_WITH_DURABLE_NONCE);
      const txJson = tx.toJson();
      txJson.durableNonce.should.deepEqual({
        walletNonceAddress: nonceAccount.pub,
        authWalletAddress: authAccount.pub,
      });
    });

    it('build a transfer tx unsigned with memo and durable nonce', async () => {
      const txBuilder = factory.getTransferBuilderV2();
      txBuilder.nonce(recentBlockHash, { walletNonceAddress: nonceAccount.pub, authWalletAddress: authAccount.pub });
      txBuilder.sender(authAccount.pub);
      txBuilder.feePayer(feePayerAccount.pub);
      txBuilder.send({ address: otherAccount.pub, amount });
      txBuilder.memo(memo);
      const tx = await txBuilder.build();
      tx.inputs.length.should.equal(1);
      tx.inputs[0].should.deepEqual({
        address: authAccount.pub,
        value: amount,
        coin: 'tsol',
      });
      tx.outputs.length.should.equal(1);
      tx.outputs[0].should.deepEqual({
        address: otherAccount.pub,
        value: amount,
        coin: 'tsol',
      });
      const rawTx = tx.toBroadcastFormat();
      should.equal(Utils.isValidRawTransaction(rawTx), true);
      should.equal(rawTx, testData.NATIVE_TRANSFERV2_UNSIGNED_TX_WITH_MEMO_AND_DURABLE_NONCE);
    });

    it('build a transfer tx unsigned without memo or durable nonce', async () => {
      const txBuilder = factory.getTransferBuilderV2();
      txBuilder.nonce(recentBlockHash);
      txBuilder.feePayer(feePayerAccount.pub);
      txBuilder.sender(authAccount.pub);
      txBuilder.send({ address: otherAccount.pub, amount });
      const tx = await txBuilder.build();
      tx.inputs.length.should.equal(1);
      tx.inputs[0].should.deepEqual({
        address: authAccount.pub,
        value: amount,
        coin: 'tsol',
      });
      tx.outputs.length.should.equal(1);
      tx.outputs[0].should.deepEqual({
        address: otherAccount.pub,
        value: amount,
        coin: 'tsol',
      });
      const rawTx = tx.toBroadcastFormat();
      should.equal(Utils.isValidRawTransaction(rawTx), true);
      should.equal(rawTx, testData.NATIVE_TRANSFERV2_UNSIGNED_TX_WITHOUT_MEMO);
    });

    it('build a transfer tx signed with memo and durable nonce', async () => {
      const recentBlockHash = await getLatestBlockhash();
      const txBuilder = factory.getTransferBuilderV2();
      txBuilder.nonce(recentBlockHash);
      txBuilder.feePayer(feePayerAccount.pub);
      txBuilder.sender(authAccount.pub);
      txBuilder.send({ address: otherAccount.pub, amount });
      txBuilder.memo(memo);
      txBuilder.sign({ key: authAccount.prv });
      const tx = await txBuilder.build();
      tx.inputs.length.should.equal(1);
      tx.inputs[0].should.deepEqual({
        address: authAccount.pub,
        value: amount,
        coin: 'tsol',
      });
      tx.outputs.length.should.equal(1);
      tx.outputs[0].should.deepEqual({
        address: otherAccount.pub,
        value: amount,
        coin: 'tsol',
      });
      const rawTx = tx.toBroadcastFormat();
      // const base58 = bs58.encode(Buffer.from(rawTx, 'base64'));

      should.equal(Utils.isValidRawTransaction(rawTx), true);
      should.equal(rawTx, testData.NATIVE_TRANSFERV2_SIGNED_TX_WITH_MEMO_AND_DURABLE_NONCE);
    });

    it('build a multi transfer tx signed with memo and durable nonce', async () => {
      const account1 = new KeyPair({ prv: testData.extraAccounts.prv1 }).getKeys();
      const account2 = new KeyPair({ prv: testData.extraAccounts.prv2 }).getKeys();
      const account3 = new KeyPair({ prv: testData.extraAccounts.prv3 }).getKeys();
      const account4 = new KeyPair({ prv: testData.extraAccounts.prv4 }).getKeys();
      const account5 = new KeyPair({ prv: testData.extraAccounts.prv5 }).getKeys();

      const txBuilder = factory.getTransferBuilderV2();
      txBuilder.nonce(recentBlockHash, { walletNonceAddress: nonceAccount.pub, authWalletAddress: authAccount.pub });
      txBuilder.sender(authAccount.pub);
      txBuilder.feePayer(feePayerAccount.pub);
      txBuilder.send({ address: otherAccount.pub, amount });
      txBuilder.send({ address: account1.pub, amount });
      txBuilder.send({ address: account2.pub, amount });
      txBuilder.send({ address: account3.pub, amount });
      txBuilder.send({ address: account4.pub, amount });
      txBuilder.send({ address: account5.pub, amount });
      txBuilder.memo(memo);
      txBuilder.sign({ key: authAccount.prv });
      const tx = await txBuilder.build();
      tx.inputs.length.should.equal(6);
      tx.inputs[0].should.deepEqual({
        address: authAccount.pub,
        value: amount,
        coin: 'tsol',
      });
      tx.inputs[1].should.deepEqual({
        address: authAccount.pub,
        value: amount,
        coin: 'tsol',
      });
      tx.inputs[2].should.deepEqual({
        address: authAccount.pub,
        value: amount,
        coin: 'tsol',
      });
      tx.inputs[3].should.deepEqual({
        address: authAccount.pub,
        value: amount,
        coin: 'tsol',
      });
      tx.inputs[4].should.deepEqual({
        address: authAccount.pub,
        value: amount,
        coin: 'tsol',
      });
      tx.inputs[5].should.deepEqual({
        address: authAccount.pub,
        value: amount,
        coin: 'tsol',
      });
      tx.outputs.length.should.equal(6);
      tx.outputs[0].should.deepEqual({
        address: otherAccount.pub,
        value: amount,
        coin: 'tsol',
      });
      tx.outputs[1].should.deepEqual({
        address: account1.pub,
        value: amount,
        coin: 'tsol',
      });
      tx.outputs[2].should.deepEqual({
        address: account2.pub,
        value: amount,
        coin: 'tsol',
      });
      tx.outputs[3].should.deepEqual({
        address: account3.pub,
        value: amount,
        coin: 'tsol',
      });
      tx.outputs[4].should.deepEqual({
        address: account4.pub,
        value: amount,
        coin: 'tsol',
      });
      tx.outputs[5].should.deepEqual({
        address: account5.pub,
        value: amount,
        coin: 'tsol',
      });
      const rawTx = tx.toBroadcastFormat();
      should.equal(Utils.isValidRawTransaction(rawTx), true);
      should.equal(rawTx, testData.NATIVE_MULTI_TRANSFERV2_SIGNED);
    });
  });
  describe('Fail Native Transfer', () => {
    it('for invalid sender', () => {
      const txBuilder = transferBuilderV2();
      should(() => txBuilder.sender(invalidPubKey)).throwError('Invalid or missing sender, got: ' + invalidPubKey);
    });

    it('for invalid toAddress', () => {
      const txBuilder = transferBuilderV2();
      should(() => txBuilder.send({ address: invalidPubKey, amount })).throwError(
        'Invalid or missing address, got: ' + invalidPubKey
      );
    });

    it('for invalid amount', () => {
      const invalidAmount = 'randomstring';
      const txBuilder = transferBuilderV2();
      should(() => txBuilder.send({ address: nonceAccount.pub, amount: invalidAmount })).throwError(
        'Invalid or missing amount, got: ' + invalidAmount
      );
    });

    it('to sign twice with the same key', () => {
      const txBuilder = factory.from(testData.TRANSFER_UNSIGNED_TX_WITH_MEMO_AND_DURABLE_NONCE);
      txBuilder.sign({ key: authAccount.prv });
      should(() => txBuilder.sign({ key: authAccount.prv })).throwError(
        'Duplicated signer: ' + authAccount.prv?.toString()
      );
    });
  });
  describe('Succeed Token Transfer', () => {
    before(async () => {
      ataAddress = await Utils.getAssociatedTokenAccountAddress(mintUSDC, otherAccount.pub);
    });
    it('build a token transfer tx unsigned with memo', async () => {
      const txBuilder = factory.getTransferBuilderV2();
      txBuilder.nonce(recentBlockHash);
      txBuilder.feePayer(feePayerAccount.pub);
      txBuilder.sender(walletPK);
      txBuilder.send({ address: otherAccount.pub, amount, tokenName: nameUSDC });
      txBuilder.memo(memo);
      txBuilder.setPriorityFee(priorityFee);
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
      should.equal(rawTx, testData.TOKEN_TRANSFERV2_UNSIGNED_TX_WITH_MEMO);
    });

    it('build a token transfer tx unsigned with durable nonce', async () => {
      const txBuilder = factory.getTransferBuilderV2();
      txBuilder.nonce(recentBlockHash, { walletNonceAddress: nonceAccount.pub, authWalletAddress: walletPK });
      txBuilder.feePayer(feePayerAccount.pub);
      txBuilder.sender(walletPK);
      txBuilder.send({ address: otherAccount.pub, amount, tokenName: nameUSDC });
      txBuilder.setPriorityFee(priorityFee);
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
      should.equal(rawTx, testData.TOKEN_TRANSFERV2_UNSIGNED_TX_WITH_DURABLE_NONCE);
      const txJson = tx.toJson();
      txJson.durableNonce.should.deepEqual({
        walletNonceAddress: nonceAccount.pub,
        authWalletAddress: walletPK,
      });
    });

    it('build a token transfer tx unsigned with memo and durable nonce', async () => {
      const txBuilder = factory.getTransferBuilderV2();
      txBuilder.nonce(recentBlockHash, { walletNonceAddress: nonceAccount.pub, authWalletAddress: walletPK });
      txBuilder.feePayer(feePayerAccount.pub);
      txBuilder.sender(walletPK);
      txBuilder.send({ address: otherAccount.pub, amount, tokenName: nameUSDC });
      txBuilder.memo(memo);
      txBuilder.setPriorityFee(priorityFee);
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
      should.equal(rawTx, testData.TOKEN_TRANSFERV2_UNSIGNED_TX_WITH_MEMO_AND_DURABLE_NONCE);
    });

    it('build a token transfer tx unsigned without memo or durable nonce', async () => {
      const txBuilder = factory.getTransferBuilderV2();
      txBuilder.nonce(recentBlockHash);
      txBuilder.feePayer(feePayerAccount.pub);
      txBuilder.sender(walletPK);
      txBuilder.send({ address: otherAccount.pub, amount, tokenName: nameUSDC });
      txBuilder.setPriorityFee(priorityFee);
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
      should.equal(rawTx, testData.TOKEN_TRANSFERV2_UNSIGNED_TX_WITHOUT_MEMO);
    });

    it('build a token transfer tx signed with memo and durable nonce', async () => {
      const txBuilder = factory.getTransferBuilderV2();
      txBuilder.nonce(recentBlockHash, {
        walletNonceAddress: nonceAccount.pub,
        authWalletAddress: walletPK,
      });
      txBuilder.feePayer(feePayerAccount.pub);
      txBuilder.sender(walletPK);
      txBuilder.send({ address: otherAccount.pub, amount, tokenName: nameUSDC });
      txBuilder.memo(memo);
      txBuilder.sign({ key: walletSK });
      txBuilder.setPriorityFee(priorityFee);
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
      should.equal(rawTx, testData.TOKEN_TRANSFERV2_SIGNED_TX_WITH_MEMO_AND_DURABLE_NONCE);
    });

    it('build a token transfer tx unsigned with create ATA, memo and durable nonce', async () => {
      const txBuilder = factory.getTransferBuilderV2();
      txBuilder.nonce(recentBlockHash, {
        walletNonceAddress: nonceAccount.pub,
        authWalletAddress: walletPK,
      });
      txBuilder.feePayer(feePayerAccount.pub);
      txBuilder.sender(walletPK);
      txBuilder.send({ address: otherAccount.pub, amount, tokenName: nameUSDC });
      txBuilder.memo(memo);
      txBuilder.createAssociatedTokenAccount({ ownerAddress: otherAccount.pub, tokenName: nameUSDC });
      txBuilder.sign({ key: walletSK });
      txBuilder.setPriorityFee(priorityFee);
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
      const txJson = tx.toJson();
      txJson.instructionsData.length.should.equal(4);
      txJson.instructionsData[0].type.should.equal('SetPriorityFee');
      txJson.instructionsData[1].type.should.equal('CreateAssociatedTokenAccount');
      txJson.instructionsData[1].params.should.deepEqual({
        mintAddress: mintUSDC,
        ataAddress: ataAddress,
        ownerAddress: otherAccount.pub,
        payerAddress: walletPK,
        tokenName: nameUSDC,
        programId: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
      });
      txJson.instructionsData[2].type.should.equal('TokenTransfer');
      txJson.instructionsData[2].params.should.deepEqual({
        fromAddress: walletPK,
        toAddress: otherAccount.pub,
        amount: amount,
        tokenName: nameUSDC,
        sourceAddress: 'B5rJjuVi7En63iK6o3ijKdJwAoTe2gwCYmJsVdHQ2aKV',
        tokenAddress: 'F4uLeXJoFz3hw13MposuwaQbMcZbCjqvEGPPeRRB1Byf',
        programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        decimalPlaces: 9,
      });
      txJson.instructionsData[3].type.should.equal('Memo');
      txJson.instructionsData[3].params.memo.should.equal(memo);

      const rawTx = tx.toBroadcastFormat();
      should.equal(Utils.isValidRawTransaction(rawTx), true);
      should.equal(rawTx, testData.TOKEN_TRANSFERV2_SIGNED_TX_WITH_WITH_CREATE_ATA_AND_MEMO_AND_DURABLE_NONCE);
    });

    it('build a token transfer tx unsigned with create ATA, memo, tokenAddress and durable nonce', async () => {
      const txBuilder = factory.getTransferBuilderV2();
      txBuilder.nonce(recentBlockHash, {
        walletNonceAddress: nonceAccount.pub,
        authWalletAddress: walletPK,
      });
      txBuilder.feePayer(feePayerAccount.pub);
      txBuilder.sender(walletPK);
      txBuilder.send({
        address: otherAccount.pub,
        amount,
        tokenName: nameAMS,
        tokenAddress: mintAMS,
        programId: amsProgramID,
        decimalPlaces: 9,
      });
      txBuilder.memo(memo);
      txBuilder.createAssociatedTokenAccount({
        ownerAddress: otherAccount.pub,
        tokenName: nameAMS,
        tokenAddress: mintAMS,
        programId: amsProgramID,
      });
      txBuilder.sign({ key: walletSK });
      txBuilder.setPriorityFee(priorityFee);
      const tx = await txBuilder.build();
      tx.id.should.not.equal(undefined);
      tx.inputs.length.should.equal(1);
      tx.inputs[0].should.deepEqual({
        address: walletPK,
        value: amount,
        coin: nameAMS,
      });
      tx.outputs.length.should.equal(1);
      tx.outputs[0].should.deepEqual({
        address: otherAccount.pub,
        value: amount,
        coin: nameAMS,
      });
      const txJson = tx.toJson();
      txJson.instructionsData.length.should.equal(4);
      txJson.instructionsData[0].type.should.equal('SetPriorityFee');
      txJson.instructionsData[1].type.should.equal('CreateAssociatedTokenAccount');
      txJson.instructionsData[1].params.should.deepEqual({
        mintAddress: mintAMS,
        ataAddress: '8KLnroP6hHkr1ZsQL4k6A3i2yhhnv2kr2Teedx7a26Eg',
        ownerAddress: otherAccount.pub,
        payerAddress: walletPK,
        tokenName: nameAMS,
        programId: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
      });
      txJson.instructionsData[2].type.should.equal('TokenTransfer');
      txJson.instructionsData[2].params.should.deepEqual({
        fromAddress: walletPK,
        toAddress: otherAccount.pub,
        amount: amount,
        tokenName: nameAMS,
        sourceAddress: 'EytHm3gWSmaTkuF1datepgDzx7grGuDG7ws5QA7tCmU4',
        tokenAddress: 'F4uLeXioFz3hw13MposuwaQbMcZbCjqvEGPPeRRB1Byf',
        programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        decimalPlaces: 9,
      });
      txJson.instructionsData[3].type.should.equal('Memo');
      txJson.instructionsData[3].params.memo.should.equal(memo);

      const rawTx = tx.toBroadcastFormat();
      should.equal(Utils.isValidRawTransaction(rawTx), true);
      should.equal(
        rawTx,
        testData.TOKEN_TRANSFERV2_SIGNED_TX_WITH_WITH_CREATE_ATA_AND_MEMO_AND_DURABLE_NONCE_WITH_OPTIONAL_PARAMS
      );
    });

    it('build a token multi transfer tx signed with memo and durable nonce', async () => {
      const account1 = new KeyPair({ prv: testData.extraAccounts.prv1 }).getKeys();
      const account2 = new KeyPair({ prv: testData.extraAccounts.prv2 }).getKeys();
      const account3 = new KeyPair({ prv: testData.extraAccounts.prv3 }).getKeys();
      const account4 = new KeyPair({ prv: testData.extraAccounts.prv4 }).getKeys();
      const account5 = new KeyPair({ prv: testData.extraAccounts.prv5 }).getKeys();
      const txBuilder = factory.getTransferBuilderV2();

      txBuilder.nonce(recentBlockHash, { walletNonceAddress: nonceAccount.pub, authWalletAddress: authAccount.pub });
      txBuilder.sender(owner);
      txBuilder.feePayer(feePayerAccount.pub);
      txBuilder.send({ address: otherAccount.pub, amount, tokenName: nameUSDC });
      txBuilder.send({ address: account1.pub, amount, tokenName: nameUSDC });
      txBuilder.send({ address: account2.pub, amount, tokenName: nameUSDC });
      txBuilder.send({ address: account3.pub, amount, tokenName: nameUSDC });
      txBuilder.send({ address: account4.pub, amount, tokenName: nameUSDC });
      txBuilder.send({ address: account5.pub, amount, tokenName: nameUSDC });
      txBuilder.memo(memo);
      txBuilder.sign({ key: authAccount.prv });
      txBuilder.setPriorityFee(priorityFee);
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
      should.equal(rawTx, testData.MULTI_TOKEN_TRANSFERV2_SIGNED);
    });

    it('build a token multi asset transfer tx unsigned', async () => {
      const account1 = new KeyPair({ prv: testData.extraAccounts.prv1 }).getKeys();
      const account2 = new KeyPair({ prv: testData.extraAccounts.prv2 }).getKeys();
      const account3 = new KeyPair({ prv: testData.extraAccounts.prv3 }).getKeys();
      const txBuilder = factory.getTransferBuilderV2();
      const nameSRM = 'tsol:srm';
      const nameRAY = 'tsol:ray';

      txBuilder.nonce(recentBlockHash);
      txBuilder.feePayer(feePayerAccount.pub);
      txBuilder.sender(owner);
      txBuilder.send({ address: otherAccount.pub, amount, tokenName: nameUSDC });
      txBuilder.send({ address: account1.pub, amount, tokenName: nameUSDC });
      txBuilder.send({ address: account2.pub, amount, tokenName: nameSRM });
      txBuilder.send({ address: account3.pub, amount, tokenName: nameRAY });
      txBuilder.setPriorityFee(priorityFee);
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
      txJson.instructionsData.length.should.equal(5);
      txJson.instructionsData[1].params.sourceAddress.should.equal(testData.tokenTransfers.sourceUSDC);
      txJson.instructionsData[2].params.sourceAddress.should.equal(testData.tokenTransfers.sourceUSDC);
      txJson.instructionsData[3].params.sourceAddress.should.equal(testData.tokenTransfers.sourceSRM);
      txJson.instructionsData[4].params.sourceAddress.should.equal(testData.tokenTransfers.sourceRAY);

      const rawTx = tx.toBroadcastFormat();
      should.equal(Utils.isValidRawTransaction(rawTx), true);
      should.equal(rawTx, testData.MULTI_ASSET_TOKEN_TRANSFERV2_UNSIGNED);
    });
  });
  describe('Fail Token Transfer', () => {
    it('for invalid sender', () => {
      const txBuilder = transferBuilderV2();
      should(() => txBuilder.sender(invalidPubKey)).throwError('Invalid or missing sender, got: ' + invalidPubKey);
    });

    it('for invalid toAddress', () => {
      const txBuilder = transferBuilderV2();
      should(() => txBuilder.send({ address: invalidPubKey, amount, tokenName: nameUSDC })).throwError(
        'Invalid or missing address, got: ' + invalidPubKey
      );
    });

    it('for invalid amount', () => {
      const invalidAmount = 'randomstring';
      const txBuilder = transferBuilderV2();
      should(() =>
        txBuilder.send({
          address: nonceAccount.pub,
          amount: invalidAmount,
          tokenName: nameUSDC,
        })
      ).throwError('Invalid or missing amount, got: ' + invalidAmount);
    });
  });
  describe('Suceed Native and Token Transfer', () => {
    it('build a transfer tx with both native and token', async () => {
      const txBuilder = factory.getTransferBuilderV2();
      txBuilder.nonce(recentBlockHash);
      txBuilder.feePayer(feePayerAccount.pub);
      txBuilder.sender(authAccount.pub);
      txBuilder.send({ address: otherAccount.pub, amount });
      txBuilder.send({ address: otherAccount.pub, amount, tokenName: nameUSDC });
      txBuilder.setPriorityFee(priorityFee);
      const tx = await txBuilder.build();
      tx.inputs.length.should.equal(2);
      tx.inputs[0].should.deepEqual({
        address: authAccount.pub,
        value: amount,
        coin: 'tsol',
      });
      tx.inputs[1].should.deepEqual({
        address: authAccount.pub,
        value: amount,
        coin: nameUSDC,
      });
      tx.outputs.length.should.equal(2);
      tx.outputs[0].should.deepEqual({
        address: otherAccount.pub,
        value: amount,
        coin: 'tsol',
      });
      tx.outputs[1].should.deepEqual({
        address: otherAccount.pub,
        value: amount,
        coin: nameUSDC,
      });
      const rawTx = tx.toBroadcastFormat();
      should.equal(Utils.isValidRawTransaction(rawTx), true);
      should.equal(rawTx, testData.NATIVE_AND_TOKEN_TRANSFERV2_UNSIGNED);
    });
    it('build a multi transfer tx with both native and multiple token', async () => {
      const txBuilder = factory.getTransferBuilderV2();
      txBuilder.nonce(recentBlockHash);
      txBuilder.feePayer(feePayerAccount.pub);
      txBuilder.sender(authAccount.pub);
      txBuilder.send({ address: otherAccount.pub, amount });
      txBuilder.send({ address: otherAccount.pub, amount, tokenName: nameUSDC });
      txBuilder.send({ address: otherAccount.pub, amount, tokenName: nameUSDC });
      txBuilder.send({ address: otherAccount.pub, amount, tokenName: nameUSDC });
      txBuilder.setPriorityFee(priorityFee);
      const tx = await txBuilder.build();
      tx.inputs.length.should.equal(4);
      tx.inputs[0].should.deepEqual({
        address: authAccount.pub,
        value: amount,
        coin: 'tsol',
      });
      tx.inputs[1].should.deepEqual({
        address: authAccount.pub,
        value: amount,
        coin: nameUSDC,
      });
      tx.inputs[2].should.deepEqual({
        address: authAccount.pub,
        value: amount,
        coin: nameUSDC,
      });
      tx.inputs[3].should.deepEqual({
        address: authAccount.pub,
        value: amount,
        coin: nameUSDC,
      });
      tx.outputs.length.should.equal(4);
      tx.outputs[0].should.deepEqual({
        address: otherAccount.pub,
        value: amount,
        coin: 'tsol',
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
      tx.outputs[3].should.deepEqual({
        address: otherAccount.pub,
        value: amount,
        coin: nameUSDC,
      });
      const rawTx = tx.toBroadcastFormat();
      should.equal(Utils.isValidRawTransaction(rawTx), true);
      should.equal(rawTx, testData.MULTI_NATIVE_AND_TOKEN_TRANSFERV2_UNSIGNED);
    });
  });
  describe('Fail Native and Token Transfer', () => {
    it('for invalid toAddress', () => {
      const txBuilder = transferBuilderV2();
      txBuilder.send({ address: otherAccount.pub, amount });
      should(() => txBuilder.send({ address: invalidPubKey, amount, tokenName: nameUSDC })).throwError(
        'Invalid or missing address, got: ' + invalidPubKey
      );
    });

    it('for invalid amount', () => {
      const invalidAmount = 'randomstring';
      const txBuilder = transferBuilderV2();
      txBuilder.send({ address: otherAccount.pub, amount });
      txBuilder.send({ address: otherAccount.pub, amount, tokenName: nameUSDC });
      should(() =>
        txBuilder.send({
          address: nonceAccount.pub,
          amount: invalidAmount,
          tokenName: nameUSDC,
        })
      ).throwError('Invalid or missing amount, got: ' + invalidAmount);

      const excessiveTokenAmount = '18446744073709551616';
      should(() =>
        txBuilder.send({
          address: nonceAccount.pub,
          amount: excessiveTokenAmount,
          tokenName: nameUSDC,
        })
      ).throwError(`input amount ${excessiveTokenAmount} exceeds big int limit 18446744073709551615`);

      const excessiveAmount = '9007199254740992';
      should(() => txBuilder.send({ address: nonceAccount.pub, amount: excessiveAmount })).throwError(
        `input amount ${excessiveAmount} exceeds max safe int 9007199254740991`
      );
    });
  });
});
