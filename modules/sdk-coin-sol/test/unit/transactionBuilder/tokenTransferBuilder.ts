import { getBuilderFactory } from '../getBuilderFactory';
import { KeyPair, Utils } from '../../../src';
import should from 'should';
import * as testData from '../../resources/sol';
import { FeeOptions } from '@bitgo/sdk-core';
import { TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { ExtraAccountMeta } from '../../../src/lib/iface';

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
  const nameAMS = testData.amsTokenTransfers.nameAMSToken;
  const mintAMS = testData.amsTokenTransfers.mintAMS;
  const amsProgramID = testData.amsTokenTransfers.programID;
  const walletPK = testData.associatedTokenAccounts.accounts[0].pub;
  const walletSK = testData.associatedTokenAccounts.accounts[0].prv;
  const prioFeeMicroLamports = '10000000';
  const priorityFee: FeeOptions = {
    amount: prioFeeMicroLamports,
  };
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
      should.equal(rawTx, testData.TOKEN_TRANSFER_UNSIGNED_TX_WITH_MEMO);
    });

    it('build a token transfer tx unsigned with durable nonce', async () => {
      const txBuilder = factory.getTokenTransferBuilder();
      txBuilder.nonce(recentBlockHash, { walletNonceAddress: nonceAccount.pub, authWalletAddress: walletPK });
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
      should.equal(rawTx, testData.TOKEN_TRANSFER_UNSIGNED_TX_WITH_MEMO_AND_DURABLE_NONCE);
    });

    it('build a token transfer tx unsigned without memo or durable nonce', async () => {
      const txBuilder = factory.getTokenTransferBuilder();
      txBuilder.nonce(recentBlockHash);
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
      txJson.instructionsData[0].type.should.equal('SetPriorityFee');
      txJson.instructionsData[1].params.sourceAddress.should.equal(testData.tokenTransfers.sourceUSDC);
      txJson.instructionsData[2].params.sourceAddress.should.equal(testData.tokenTransfers.sourceUSDC);
      txJson.instructionsData[3].params.sourceAddress.should.equal(testData.tokenTransfers.sourceSRM);
      txJson.instructionsData[4].params.sourceAddress.should.equal(testData.tokenTransfers.sourceRAY);

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
      txBuilder.setPriorityFee(priorityFee);
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
      txBuilder.createAssociatedTokenAccount({
        ownerAddress: otherAccount.pub,
        tokenName: nameUSDC,
        ataAddress: ataAddress,
      });
      const prioFeeMicroLamports = '0';
      const priorityFee: FeeOptions = {
        amount: prioFeeMicroLamports,
      };
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
      const txJson = tx.toJson();
      // Since prio fee is 0, we are not adding compute unit price instruction
      txJson.instructionsData.length.should.equal(3);
      txJson.instructionsData[0].type.should.equal('CreateAssociatedTokenAccount');
      txJson.instructionsData[0].params.should.deepEqual({
        mintAddress: mintUSDC,
        ataAddress: ataAddress,
        ownerAddress: otherAccount.pub,
        payerAddress: walletPK,
        tokenName: nameUSDC,
        programId: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
      });
      txJson.instructionsData[1].type.should.equal('TokenTransfer');
      txJson.instructionsData[1].params.should.deepEqual({
        fromAddress: walletPK,
        toAddress: otherAccount.pub,
        amount: amount,
        tokenName: nameUSDC,
        sourceAddress: 'B5rJjuVi7En63iK6o3ijKdJwAoTe2gwCYmJsVdHQ2aKV',
        tokenAddress: 'F4uLeXJoFz3hw13MposuwaQbMcZbCjqvEGPPeRRB1Byf',
        programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        decimalPlaces: 9,
      });
      txJson.instructionsData[2].type.should.equal('Memo');
      txJson.instructionsData[2].params.memo.should.equal(memo);

      const rawTx = tx.toBroadcastFormat();
      should.equal(Utils.isValidRawTransaction(rawTx), true);
      should.equal(rawTx, testData.TOKEN_TRANSFER_UNSIGNED_WITH_CREATE_ATA_AND_MEMO_AND_DURABLE_NONCE);
    });

    it('build a token transfer tx unsigned with create ATA, memo and durable nonce with optional param', async () => {
      const txBuilder = factory.getTokenTransferBuilder();
      txBuilder.nonce(recentBlockHash, { walletNonceAddress: nonceAccount.pub, authWalletAddress: walletPK });
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
      const prioFeeMicroLamports = '0';
      const priorityFee: FeeOptions = {
        amount: prioFeeMicroLamports,
      };
      txBuilder.setPriorityFee(priorityFee);
      const tx = await txBuilder.build();
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
      // Since prio fee is 0, we are not adding compute unit price instruction
      txJson.instructionsData.length.should.equal(3);
      txJson.instructionsData[0].type.should.equal('CreateAssociatedTokenAccount');
      txJson.instructionsData[0].params.should.deepEqual({
        mintAddress: mintAMS,
        ataAddress: '8KLnroP6hHkr1ZsQL4k6A3i2yhhnv2kr2Teedx7a26Eg',
        ownerAddress: otherAccount.pub,
        payerAddress: walletPK,
        tokenName: nameAMS,
        programId: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
      });
      txJson.instructionsData[1].type.should.equal('TokenTransfer');
      txJson.instructionsData[1].params.should.deepEqual({
        fromAddress: walletPK,
        toAddress: otherAccount.pub,
        amount: amount,
        tokenName: nameAMS,
        sourceAddress: 'EytHm3gWSmaTkuF1datepgDzx7grGuDG7ws5QA7tCmU4',
        tokenAddress: 'F4uLeXioFz3hw13MposuwaQbMcZbCjqvEGPPeRRB1Byf',
        programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        decimalPlaces: 9,
      });
      txJson.instructionsData[2].type.should.equal('Memo');
      txJson.instructionsData[2].params.memo.should.equal(memo);

      const rawTx = tx.toBroadcastFormat();
      should.equal(Utils.isValidRawTransaction(rawTx), true);
      should.equal(
        rawTx,
        testData.TOKEN_TRANSFER_UNSIGNED_WITH_CREATE_ATA_AND_MEMO_AND_DURABLE_NONCE_WITH_OPTIONAL_PARAMS
      );
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
      txBuilder.createAssociatedTokenAccount({
        ownerAddress: otherAccount.pub,
        tokenName: nameUSDC,
        ataAddress: ataAddress,
      });
      txBuilder.createAssociatedTokenAccount({
        ownerAddress: account1.pub,
        tokenName: nameUSDC,
        ataAddress: ataAddress1,
      });
      txBuilder.createAssociatedTokenAccount({
        ownerAddress: account2.pub,
        tokenName: nameUSDC,
        ataAddress: ataAddress2,
      });
      txBuilder.setPriorityFee(priorityFee);
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
      txJson.instructionsData.length.should.equal(8);
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
      txJson.instructionsData[2].type.should.equal('CreateAssociatedTokenAccount');
      txJson.instructionsData[2].params.should.deepEqual({
        mintAddress: mintUSDC,
        ataAddress: ataAddress1,
        ownerAddress: account1.pub,
        payerAddress: walletPK,
        tokenName: nameUSDC,
        programId: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
      });
      txJson.instructionsData[2].type.should.equal('CreateAssociatedTokenAccount');
      txJson.instructionsData[3].params.should.deepEqual({
        mintAddress: mintUSDC,
        ataAddress: ataAddress2,
        ownerAddress: account2.pub,
        payerAddress: walletPK,
        tokenName: nameUSDC,
        programId: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
      });
      txJson.instructionsData.length.should.equal(8);
      txJson.instructionsData[4].type.should.equal('TokenTransfer');
      txJson.instructionsData[4].params.should.deepEqual({
        fromAddress: walletPK,
        toAddress: otherAccount.pub,
        amount: amount,
        tokenName: nameUSDC,
        sourceAddress: 'B5rJjuVi7En63iK6o3ijKdJwAoTe2gwCYmJsVdHQ2aKV',
        tokenAddress: 'F4uLeXJoFz3hw13MposuwaQbMcZbCjqvEGPPeRRB1Byf',
        programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        decimalPlaces: 9,
      });
      txJson.instructionsData[5].type.should.equal('TokenTransfer');
      txJson.instructionsData[5].params.should.deepEqual({
        fromAddress: walletPK,
        toAddress: account1.pub,
        amount: amount,
        tokenName: nameUSDC,
        sourceAddress: 'B5rJjuVi7En63iK6o3ijKdJwAoTe2gwCYmJsVdHQ2aKV',
        tokenAddress: 'F4uLeXJoFz3hw13MposuwaQbMcZbCjqvEGPPeRRB1Byf',
        programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        decimalPlaces: 9,
      });
      txJson.instructionsData[6].type.should.equal('TokenTransfer');
      txJson.instructionsData[6].params.should.deepEqual({
        fromAddress: walletPK,
        toAddress: account2.pub,
        amount: amount,
        tokenName: nameUSDC,
        sourceAddress: 'B5rJjuVi7En63iK6o3ijKdJwAoTe2gwCYmJsVdHQ2aKV',
        tokenAddress: 'F4uLeXJoFz3hw13MposuwaQbMcZbCjqvEGPPeRRB1Byf',
        programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        decimalPlaces: 9,
      });
      txJson.instructionsData[7].type.should.equal('Memo');
      txJson.instructionsData[7].params.memo.should.equal(memo);

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
      txBuilder.createAssociatedTokenAccount({
        ownerAddress: otherAccount.pub,
        tokenName: nameUSDC,
        ataAddress: ataAddress,
      });
      txBuilder.createAssociatedTokenAccount({
        ownerAddress: otherAccount.pub,
        tokenName: nameUSDC,
        ataAddress: ataAddress,
      });
      txBuilder.createAssociatedTokenAccount({
        ownerAddress: otherAccount.pub,
        tokenName: nameUSDC,
        ataAddress: ataAddress,
      });
      txBuilder.setPriorityFee(priorityFee);
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
      txJson.instructionsData.length.should.equal(6);
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
      txJson.instructionsData[3].type.should.equal('TokenTransfer');
      txJson.instructionsData[3].params.should.deepEqual({
        fromAddress: walletPK,
        toAddress: otherAccount.pub,
        amount: amount,
        tokenName: nameUSDC,
        sourceAddress: 'B5rJjuVi7En63iK6o3ijKdJwAoTe2gwCYmJsVdHQ2aKV',
        tokenAddress: 'F4uLeXJoFz3hw13MposuwaQbMcZbCjqvEGPPeRRB1Byf',
        programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        decimalPlaces: 9,
      });
      txJson.instructionsData[4].type.should.equal('TokenTransfer');
      txJson.instructionsData[4].params.should.deepEqual({
        fromAddress: walletPK,
        toAddress: otherAccount.pub,
        amount: amount,
        tokenName: nameUSDC,
        sourceAddress: 'B5rJjuVi7En63iK6o3ijKdJwAoTe2gwCYmJsVdHQ2aKV',
        tokenAddress: 'F4uLeXJoFz3hw13MposuwaQbMcZbCjqvEGPPeRRB1Byf',
        programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        decimalPlaces: 9,
      });
      txJson.instructionsData[5].type.should.equal('Memo');
      txJson.instructionsData[5].params.memo.should.equal(memo);

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
        txBuilder.createAssociatedTokenAccount({
          ownerAddress: invalidPubKey,
          tokenName: nameUSDC,
          ataAddress: ataAddress,
        })
      ).throwError('Invalid or missing ownerAddress, got: ' + invalidPubKey);
    });

    it('for invalid tokenName', () => {
      const invalidTokenName = 'tsol:random';
      const txBuilder = tokenTransferBuilder();
      should(() =>
        txBuilder.createAssociatedTokenAccount({
          ownerAddress: nonceAccount.pub,
          tokenName: invalidTokenName,
          ataAddress: ataAddress,
        })
      ).throwError('Invalid token name, got: ' + invalidTokenName);
    });
  });

  describe('Create ATA rent payer selection', () => {
    const feePayerAccount = new KeyPair(testData.feePayerAccount).getKeys();

    before(async () => {
      ataAddress = await Utils.getAssociatedTokenAccountAddress(mintUSDC, otherAccount.pub);
    });

    it('uses feePayer as Create-ATA rent payer when feePayer is set', async () => {
      const txBuilder = factory.getTokenTransferBuilder();
      txBuilder.nonce(recentBlockHash);
      txBuilder.feePayer(feePayerAccount.pub);
      txBuilder.sender(walletPK);
      txBuilder.send({ address: otherAccount.pub, amount, tokenName: nameUSDC });
      txBuilder.createAssociatedTokenAccount({
        ownerAddress: otherAccount.pub,
        tokenName: nameUSDC,
        ataAddress,
      });
      txBuilder.setPriorityFee(priorityFee);
      const tx = await txBuilder.build();
      const createAta = tx.toJson().instructionsData.find((i) => i.type === 'CreateAssociatedTokenAccount');
      should.exist(createAta);
      createAta.params.payerAddress.should.equal(feePayerAccount.pub);
      createAta.params.payerAddress.should.not.equal(walletPK);
    });

    it('falls back to sender as Create-ATA rent payer when feePayer is unset', async () => {
      const txBuilder = factory.getTokenTransferBuilder();
      txBuilder.nonce(recentBlockHash);
      txBuilder.sender(walletPK);
      txBuilder.send({ address: otherAccount.pub, amount, tokenName: nameUSDC });
      txBuilder.createAssociatedTokenAccount({
        ownerAddress: otherAccount.pub,
        tokenName: nameUSDC,
        ataAddress,
      });
      txBuilder.setPriorityFee(priorityFee);
      const tx = await txBuilder.build();
      const createAta = tx.toJson().instructionsData.find((i) => i.type === 'CreateAssociatedTokenAccount');
      should.exist(createAta);
      createAta.params.payerAddress.should.equal(walletPK);
    });
  });

  describe('Transfer Hook accounts', () => {
    const t22Name = testData.sol2022TokenTransfers.name;
    const t22Mint = testData.sol2022TokenTransfers.mint;
    const t22Decimals = 6;
    const transferHookAccounts: ExtraAccountMeta[] = [
      { pubkey: '98wFF5MpMjMQbfDF2MPzo8LCGX37unZR1ohRA1mU9GmJ', isSigner: false, isWritable: true },
      { pubkey: '48n7YGEww7fKMfJ5gJ3sQC3rM6RWGjpUsghqVfXVkR5A', isSigner: false, isWritable: false },
      { pubkey: '9sQhAH7vV3RKTCK13VY4EiNjs3qBq1srSYxdNufdAAXm', isSigner: false, isWritable: false },
    ];

    const buildToken2022Transfer = () => {
      const txBuilder = factory.getTokenTransferBuilder();
      txBuilder.nonce(recentBlockHash);
      txBuilder.sender(walletPK);
      txBuilder.send({
        address: otherAccount.pub,
        amount,
        tokenName: t22Name,
        tokenAddress: t22Mint,
        programId: TOKEN_2022_PROGRAM_ID.toString(),
        decimalPlaces: t22Decimals,
      });
      return txBuilder;
    };

    it('threads resolved transfer hook accounts into the built TokenTransfer params', async () => {
      const txBuilder = buildToken2022Transfer();
      txBuilder.transferHookAccounts(transferHookAccounts);
      const tx = await txBuilder.build();

      const tokenTransfer = tx.toJson().instructionsData.find((i) => i.type === 'TokenTransfer');
      should.exist(tokenTransfer);
      tokenTransfer.params.transferHookAccounts.should.deepEqual(transferHookAccounts);
    });

    it('omits transfer hook accounts and matches the plain transfer when none are set', async () => {
      const withHooks = await buildToken2022Transfer().transferHookAccounts(transferHookAccounts).build();
      const withoutHooks = await buildToken2022Transfer().build();

      const plainTransfer = withoutHooks.toJson().instructionsData.find((i) => i.type === 'TokenTransfer');
      should.exist(plainTransfer);
      should.equal(plainTransfer.params.transferHookAccounts, undefined);

      // Appending the resolved hook accounts changes the serialized transaction.
      withHooks.toBroadcastFormat().should.not.equal(withoutHooks.toBroadcastFormat());
      should.equal(Utils.isValidRawTransaction(withoutHooks.toBroadcastFormat()), true);
    });
  });

  describe('Permissionless thaw bundling', () => {
    const t22Name = testData.sol2022TokenTransfers.name;
    const t22Mint = testData.sol2022TokenTransfers.mint;
    const t22Decimals = 6;
    // Resolved thaw params (as produced by Sol.resolvePermissionlessThaw). Arbitrary but valid
    // base58 pubkeys used purely as fixtures — the offline builder never fetches them.
    const thawParams = {
      authority: walletPK,
      mint: t22Mint,
      tokenAccount: '98wFF5MpMjMQbfDF2MPzo8LCGX37unZR1ohRA1mU9GmJ',
      tokenAccountOwner: otherAccount.pub,
      gatingProgram: 'GbQ8ZiEFzGGTeYoXwtZtcoxwPcMyUcmZDduMVNdUPKpX',
      flagAccount: '48n7YGEww7fKMfJ5gJ3sQC3rM6RWGjpUsghqVfXVkR5A',
      mintConfig: '9sQhAH7vV3RKTCK13VY4EiNjs3qBq1srSYxdNufdAAXm',
      extraAccounts: [{ pubkey: nonceAccount.pub, isSigner: false, isWritable: false }],
    };

    const buildToken2022TransferWithAta = () => {
      const txBuilder = factory.getTokenTransferBuilder();
      txBuilder.nonce(recentBlockHash);
      txBuilder.sender(walletPK);
      txBuilder.send({
        address: otherAccount.pub,
        amount,
        tokenName: t22Name,
        tokenAddress: t22Mint,
        programId: TOKEN_2022_PROGRAM_ID.toString(),
        decimalPlaces: t22Decimals,
      });
      txBuilder.createAssociatedTokenAccount({
        ownerAddress: otherAccount.pub,
        tokenName: t22Name,
        tokenAddress: t22Mint,
        programId: TOKEN_2022_PROGRAM_ID.toString(),
      });
      return txBuilder;
    };

    it('bundles instructions in the order [create, thaw, transfer]', async () => {
      const txBuilder = buildToken2022TransferWithAta();
      txBuilder.permissionlessThaw(thawParams);
      const tx = await txBuilder.build();

      const types = tx.toJson().instructionsData.map((i) => i.type);
      types.should.deepEqual(['CreateAssociatedTokenAccount', 'PermissionlessThawIdempotent', 'TokenTransfer']);

      const thaw = tx.toJson().instructionsData.find((i) => i.type === 'PermissionlessThawIdempotent');
      should.exist(thaw);
      thaw.params.gatingProgram.should.equal(thawParams.gatingProgram);
      thaw.params.mintConfig.should.equal(thawParams.mintConfig);
      thaw.params.flagAccount.should.equal(thawParams.flagAccount);
      thaw.params.extraAccounts.should.deepEqual(thawParams.extraAccounts);
    });

    it('omits the thaw instruction when permissionlessThaw is not set', async () => {
      const tx = await buildToken2022TransferWithAta().build();
      const types = tx.toJson().instructionsData.map((i) => i.type);
      types.should.deepEqual(['CreateAssociatedTokenAccount', 'TokenTransfer']);
      should.equal(
        tx.toJson().instructionsData.find((i) => i.type === 'PermissionlessThawIdempotent'),
        undefined
      );
    });
  });
});
