import 'should';

import { BitGoAPI } from '@bitgo/sdk-api';
import { Wallet } from '@bitgo/sdk-core';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { KeyPair, Transaction, Tsol, SolVerifyTransactionOptions } from '../../src';
import { getAssociatedTokenAccountAddress } from '../../src/lib/utils';
import * as testData from '../fixtures/sol';
import * as resources from '../resources/sol';
import { getBuilderFactory } from './getBuilderFactory';
describe('SOL: CT enablement token verification', function () {
  let bitgo: TestBitGoAPI;
  let basecoin: Tsol;

  const factory = getBuilderFactory('sol');
  const account = new KeyPair(resources.associatedTokenAccounts.accounts[0]).getKeys();
  const recentBlockHash = 'GHtXQBsoZHVnNFa9YevAzFr17DJjgHXk3ycTKD5xD3Zi';

  const mintAddress = resources.associatedTokenAccountsForSol2022.mintId;
  const authorityAddress = account.pub;
  const zeroBytes36 = '00'.repeat(36);
  const proofDataHex = '00'.repeat(320);

  const v1Config = {
    computeUnitLimit: 200_000,
    heapSize: 32_768,
    loadedAccountsDataSizeLimit: 65_536,
    priorityFee: 5_000,
  };

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister('tsol', Tsol.createInstance);
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('tsol') as Tsol;
  });

  async function buildCtEnablementTxBase64(): Promise<string> {
    // ATA derived for the actual owner under the Token-2022 program, matching
    // what verifyTokenAddress recomputes from the intent.
    const tokenAddress = await getAssociatedTokenAccountAddress(mintAddress, account.pub, true);
    const txBuilder = factory.getConfidentialTransferBuilder();
    txBuilder.nonce(recentBlockHash);
    txBuilder.sender(account.pub);
    txBuilder.sign({ key: account.prv });
    txBuilder
      .createAta({
        mintAddress,
        ataAddress: tokenAddress,
        ownerAddress: authorityAddress,
        payerAddress: account.pub,
        tokenName: 'tsol:ray',
        programId: 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
      })
      .configureAccount({
        tokenAddress,
        mintAddress,
        authorityAddress,
        elgamalPubkey: '11'.repeat(32),
        decryptableZeroBalance: zeroBytes36,
        maximumPendingBalanceCreditCounter: '18446744073709551615',
        proofInstructionOffset: 1,
      })
      .verifyPubkeyValidity({ proofData: proofDataHex });
    txBuilder.version(1).transactionConfig(v1Config);
    const tx = await txBuilder.build();
    return (tx as Transaction).toBroadcastFormat();
  }

  function makeWallet(): Wallet {
    const { walletData } = testData.enableTokenFixtures;
    const walletDataClone = JSON.parse(JSON.stringify(walletData));
    // root the wallet at our signer so the fee-payer === wallet-root check passes
    walletDataClone.coinSpecific.rootAddress = account.pub;
    return new Wallet(bitgo, basecoin, walletDataClone);
  }

  it('accepts a CT enablement (CreateATA + ConfigureAccount + VerifyPubkeyValidity) tx under type enabletoken', async function () {
    const wallet = makeWallet();
    const txBase64 = await buildCtEnablementTxBase64();

    const result = await basecoin.verifyTransaction({
      txParams: {
        type: 'enabletoken',
        enableTokens: [{ name: 'tsol:t22mint', address: authorityAddress }],
      },
      txPrebuild: {
        txBase64,
        txInfo: { feePayer: account.pub, nonce: recentBlockHash },
        coin: 'tsol',
      },
      wallet,
      verification: { verifyTokenEnablement: true },
    } as unknown as SolVerifyTransactionOptions);

    result.should.equal(true);
  });

  it('still rejects an enabletoken prebuild whose token name does not match the intent', async function () {
    const wallet = makeWallet();
    const txBase64 = await buildCtEnablementTxBase64();

    await basecoin
      .verifyTransaction({
        txParams: {
          type: 'enabletoken',
          enableTokens: [{ name: 'tsol:someothertoken', address: authorityAddress }],
        },
        txPrebuild: {
          txBase64,
          txInfo: { feePayer: account.pub, nonce: recentBlockHash },
          coin: 'tsol',
        },
        wallet,
        verification: { verifyTokenEnablement: true },
      } as unknown as SolVerifyTransactionOptions)
      .should.be.rejectedWith(/Invalid token name/);
  });
});
