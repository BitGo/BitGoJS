import should from 'should';
import { TestBitGo } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { Wallet } from '@bitgo/sdk-core';
import { KeyPair, Sol, Tsol } from '../../src';
import * as resources from '../resources/sol';
import { getBuilderFactory } from './getBuilderFactory';

describe('SOL sponsored fee payer policy across intents', function () {
  const factory = getBuilderFactory('tsol');
  const blockHash = resources.blockHashes.validBlockHashes[0];
  const root = new KeyPair(resources.authAccount).getKeys().pub;
  const sponsoredFeePayer = new KeyPair(resources.authAccount2).getKeys().pub;
  const nonceAccount = new KeyPair(resources.nonceAccount).getKeys().pub;
  const stakeAccount = new KeyPair(resources.stakeAccount).getKeys().pub;
  const validator = resources.validator.pub;
  const recipient = new KeyPair({ prv: resources.prvKeys.prvKey1.base58 }).getKeys().pub;
  const tokenName = resources.tokenTransfers.nameUSDC;
  const childAddress = new KeyPair(resources.associatedTokenAccounts.accounts[0]).getKeys().pub;
  const tokenMint = resources.associatedTokenAccounts.mint;
  const walletData = {
    id: '5b34252f1bf349930e34020a00000000',
    coin: 'tsol',
    keys: ['5b3424f91bf349930e34017500000000', '5b3424f91bf349930e34017600000000', '5b3424f91bf349930e34017700000000'],
    coinSpecific: { rootAddress: root },
    multisigType: 'tss',
  };

  let basecoin: Sol;
  let wallet: Wallet;

  before(function () {
    const bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister('tsol', Tsol.createInstance);
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('tsol') as Tsol;
    wallet = new Wallet(bitgo, basecoin, walletData);
  });

  type Builder = {
    sender(address: string): Builder;
    feePayer(address: string): Builder;
    nonce(blockHash: string, durableNonce?: { walletNonceAddress: string; authWalletAddress: string }): Builder;
    send(params: { address: string; amount: string; tokenName?: string }): Builder;
    build(): Promise<{ toBroadcastFormat(): string }>;
  };

  const sponsor = (builder: Builder, feePayer: string, durable: boolean): void => {
    builder.feePayer(feePayer);
    if (durable) {
      builder.nonce(blockHash, { walletNonceAddress: nonceAccount, authWalletAddress: feePayer });
    } else {
      builder.nonce(blockHash);
    }
  };

  type Intent = {
    name: string;
    build(feePayer: string, durable: boolean): Promise<string>;
    txParams?: Record<string, unknown>;
    buildParams?: Record<string, unknown>;
    feePayerCheckExempt?: boolean;
  };

  const intents: Intent[] = [
    {
      name: 'native payment',
      txParams: { recipients: [{ address: recipient, amount: '1000' }] },
      build: async (feePayer, durable) => {
        const builder = factory.getTransferBuilder() as unknown as Builder;
        sponsor(builder, feePayer, durable);
        builder.sender(root);
        builder.send({ address: recipient, amount: '1000' });
        return (await builder.build()).toBroadcastFormat();
      },
    },
    {
      name: 'native consolidation',
      txParams: { type: 'consolidate' },
      buildParams: { type: 'consolidate' },
      feePayerCheckExempt: true,
      build: async (feePayer, durable) => {
        const builder = factory.getTransferBuilder() as unknown as Builder;
        sponsor(builder, feePayer, durable);
        builder.sender(childAddress);
        builder.send({ address: root, amount: '1000' });
        return (await builder.build()).toBroadcastFormat();
      },
    },
    {
      name: 'SPL token transfer',
      txParams: { recipients: [{ address: recipient, amount: '1000', tokenName }] },
      build: async (feePayer, durable) => {
        const builder = factory.getTokenTransferBuilder() as unknown as Builder & {
          send(params: { address: string; amount: string; tokenName: string }): Builder;
        };
        sponsor(builder, feePayer, durable);
        builder.sender(root);
        builder.send({ address: recipient, amount: '1000', tokenName });
        return (await builder.build()).toBroadcastFormat();
      },
    },
    {
      name: 'token enablement',
      build: async (feePayer, durable) => {
        const builder = factory.getAtaInitializationBuilder() as unknown as Builder & {
          mint(mint: string): Builder;
          rentExemptAmount(amount: string): Builder;
        };
        sponsor(builder, feePayer, durable);
        builder.sender(root);
        builder.mint(tokenMint);
        builder.rentExemptAmount('2039280');
        return (await builder.build()).toBroadcastFormat();
      },
    },
    {
      name: 'staking activation',
      build: async (feePayer, durable) => {
        const builder = factory.getStakingActivateBuilder() as unknown as Builder & {
          stakingAddress(address: string): Builder;
          amount(amount: string): Builder;
          validator(address: string): Builder;
        };
        sponsor(builder, feePayer, durable);
        builder.sender(root);
        builder.stakingAddress(stakeAccount);
        builder.amount('300000');
        builder.validator(validator);
        return (await builder.build()).toBroadcastFormat();
      },
    },
    {
      name: 'staking deactivation',
      build: async (feePayer, durable) => {
        const builder = factory.getStakingDeactivateBuilder() as unknown as Builder & {
          stakingAddress(address: string): Builder;
        };
        sponsor(builder, feePayer, durable);
        builder.sender(root);
        builder.stakingAddress(stakeAccount);
        return (await builder.build()).toBroadcastFormat();
      },
    },
    {
      name: 'staking withdrawal',
      build: async (feePayer, durable) => {
        const builder = factory.getStakingWithdrawBuilder() as unknown as Builder & {
          stakingAddress(address: string): Builder;
          amount(amount: string): Builder;
        };
        sponsor(builder, feePayer, durable);
        builder.sender(root);
        builder.stakingAddress(stakeAccount);
        builder.amount('300000');
        return (await builder.build()).toBroadcastFormat();
      },
    },
    {
      name: 'staking delegation',
      build: async (feePayer, durable) => {
        const builder = factory.getStakingDelegateBuilder() as unknown as Builder & {
          stakingAddress(address: string): Builder;
          validator(address: string): Builder;
        };
        sponsor(builder, feePayer, durable);
        builder.sender(root);
        builder.stakingAddress(stakeAccount);
        builder.validator(validator);
        return (await builder.build()).toBroadcastFormat();
      },
    },
    {
      feePayerCheckExempt: true,
      name: 'close associated token account',
      build: async (feePayer, durable) => {
        const builder = factory.getCloseAtaInitializationBuilder() as unknown as Builder & {
          accountAddress(address: string): Builder;
          destinationAddress(address: string): Builder;
          authorityAddress(address: string): Builder;
        };
        sponsor(builder, feePayer, durable);
        builder.sender(root);
        builder.accountAddress(nonceAccount);
        builder.destinationAddress(root);
        builder.authorityAddress(root);
        return (await builder.build()).toBroadcastFormat();
      },
    },
  ];

  for (const intent of intents) {
    for (const durable of [true, false]) {
      const mode = durable ? 'durable nonce' : 'recent blockhash';

      it(`accepts ${intent.name} with sponsored fee payer using ${mode}`, async function () {
        const txBase64 = await intent.build(sponsoredFeePayer, durable);
        const result = await basecoin.verifyTransaction({
          txParams: intent.txParams ?? {},
          txPrebuild: {
            txBase64,
            buildParams: intent.buildParams,
            coinSpecific: { solFeePayerPolicy: { feePayerAddress: sponsoredFeePayer } },
          },
          wallet,
        } as any);
        should(result).equal(true);
      });

      it(`accepts ${intent.name} with wallet-root fee payer using ${mode}`, async function () {
        const txBase64 = await intent.build(root, durable);
        const result = await basecoin.verifyTransaction({
          txParams: intent.txParams ?? {},
          txPrebuild: { txBase64, buildParams: intent.buildParams },
          wallet,
        } as any);
        should(result).equal(true);
      });

      if (intent.feePayerCheckExempt) {
        it(`accepts ${intent.name} with a mismatched declared fee payer using ${mode}`, async function () {
          const txBase64 = await intent.build(sponsoredFeePayer, durable);
          const result = await basecoin.verifyTransaction({
            txParams: intent.txParams ?? {},
            txPrebuild: { txBase64, buildParams: intent.buildParams },
            feePayer: root,
            wallet,
          } as any);
          should(result).equal(true);
        });
      } else {
        it(`rejects ${intent.name} with a mismatched declared fee payer using ${mode}`, async function () {
          const txBase64 = await intent.build(sponsoredFeePayer, durable);
          await basecoin
            .verifyTransaction({
              txParams: intent.txParams ?? {},
              txPrebuild: { txBase64, buildParams: intent.buildParams },
              feePayer: root,
              wallet,
            } as any)
            .should.be.rejectedWith(/does not match the declared sponsored fee payer/);
        });
      }
    }
  }
});
