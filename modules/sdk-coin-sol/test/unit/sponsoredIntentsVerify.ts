import should from 'should';
import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { Wallet } from '@bitgo/sdk-core';
import { PublicKey, StakeProgram } from '@solana/web3.js';
import { KeyPair, Sol, SolVerifyTransactionOptions, Tsol } from '../../src';
import { Transaction } from '../../src/lib';
import * as resources from '../resources/sol';
import { getBuilderFactory } from './getBuilderFactory';

/**
 * Every sponsored intent of the SOL fee payer project built with the real builders and verified with
 * Sol.verifyTransaction when nothing declares the fee payer (the signing path re-verifies from the transaction alone):
 * the enterprise fee address pays the fee and is accepted only while it is isolated from the instructions.
 */
describe('verifyTransaction of every sponsored intent (CHALO-998)', function () {
  const factory = getBuilderFactory('tsol');
  const blockHash = resources.blockHashes.validBlockHashes[0];
  const NOT_ROOT_ERROR = 'Tx fee payer is not the wallet root address';

  const root = new KeyPair(resources.authAccount).getKeys().pub; // the wallet root address
  const feeAddress = new KeyPair(resources.authAccount2).getKeys().pub; // the enterprise fee address
  const nonceAccount = new KeyPair(resources.nonceAccount).getKeys().pub;
  const recipient = new KeyPair({ prv: resources.prvKeys.prvKey1.base58 }).getKeys().pub;
  const stakeAccount = new KeyPair(resources.stakeAccount).getKeys().pub;
  const validator = resources.validator.pub;
  const tokenName = resources.tokenTransfers.nameUSDC;
  const mint = resources.associatedTokenAccounts.mint;
  const childAddress = new KeyPair(resources.associatedTokenAccounts.accounts[0]).getKeys().pub; // a receive address

  let bitgo: TestBitGoAPI;
  let basecoin: Sol;
  let walletObj: Wallet;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister('tsol', Tsol.createInstance);
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('tsol') as Sol;
    walletObj = new Wallet(bitgo, basecoin, {
      id: '5b34252f1bf349930e34020a00000000',
      coin: 'tsol',
      keys: [
        '5b3424f91bf349930e34017500000000',
        '5b3424f91bf349930e34017600000000',
        '5b3424f91bf349930e34017700000000',
      ],
      coinSpecific: { rootAddress: root },
      multisigType: 'tss',
    });
  });

  type SponsorableBuilder = {
    feePayer: (address: string) => unknown;
    nonce: (blockHash: string, durableNonce?: { walletNonceAddress: string; authWalletAddress: string }) => unknown;
  };

  /** Sets the sponsored fee payer, on a durable nonce the fee address owns or on a recent blockhash. */
  const sponsor = (builder: SponsorableBuilder, feePayer: string, useDurableNonce: boolean) => {
    builder.feePayer(feePayer);
    if (useDurableNonce) {
      builder.nonce(blockHash, { walletNonceAddress: nonceAccount, authWalletAddress: feePayer });
    } else {
      builder.nonce(blockHash);
    }
  };

  const verify = (txBase64: string, txParams: Record<string, unknown> = {}) =>
    basecoin.verifyTransaction({
      txParams,
      txPrebuild: { txBase64 },
      wallet: walletObj,
    } as unknown as SolVerifyTransactionOptions);

  type Intent = {
    name: string;
    /** builds the intent's transaction; feePayer is the address that pays and sender the address that signs */
    build: (feePayer: string, sender: string, useDurableNonce: boolean) => Promise<string>;
    txParams?: Record<string, unknown>;
    /** the intent is exempt from the fee payer check, so no rejection case applies */
    exempt?: boolean;
  };

  const intents: Intent[] = [
    {
      name: 'payment (native)',
      txParams: { recipients: [{ address: recipient, amount: '1000' }] },
      build: async (feePayer, sender, durable) => {
        const b = factory.getTransferBuilder();
        sponsor(b, feePayer, durable);
        b.sender(sender);
        b.send({ address: recipient, amount: '1000' });
        return (await b.build()).toBroadcastFormat();
      },
    },
    {
      name: 'payment (SPL token)',
      build: async (feePayer, sender, durable) => {
        const b = factory.getTokenTransferBuilder();
        sponsor(b, feePayer, durable);
        b.sender(sender);
        b.send({ address: recipient, amount: '1000', tokenName });
        return (await b.build()).toBroadcastFormat();
      },
    },
    {
      name: 'goUnstake (a payment from the wallet)',
      txParams: { recipients: [{ address: recipient, amount: '1000' }] },
      build: async (feePayer, sender, durable) => {
        const b = factory.getTransferBuilder();
        sponsor(b, feePayer, durable);
        b.sender(sender);
        b.send({ address: recipient, amount: '1000' });
        return (await b.build()).toBroadcastFormat();
      },
    },
    {
      name: 'enableToken',
      build: async (feePayer, sender, durable) => {
        const b = factory.getAtaInitializationBuilder();
        sponsor(b, feePayer, durable);
        b.sender(sender);
        b.mint(mint);
        b.rentExemptAmount('2039280');
        return (await b.build()).toBroadcastFormat();
      },
    },
    {
      name: 'consolidate (native sweep of a receive address)',
      build: async (feePayer, sender, durable) => {
        const b = factory.getTransferBuilder();
        sponsor(b, feePayer, durable);
        b.sender(sender === root ? childAddress : sender);
        b.send({ address: root, amount: '1000' });
        return (await b.build()).toBroadcastFormat();
      },
    },
    {
      name: 'consolidateToken (token sweep of a receive address)',
      build: async (feePayer, sender, durable) => {
        const b = factory.getTokenTransferBuilder();
        sponsor(b, feePayer, durable);
        b.sender(sender === root ? childAddress : sender);
        b.send({ address: root, amount: '1000', tokenName });
        return (await b.build()).toBroadcastFormat();
      },
    },
    {
      name: 'stake',
      build: async (feePayer, sender, durable) => {
        const b = factory.getStakingActivateBuilder();
        sponsor(b, feePayer, durable);
        b.sender(sender);
        b.stakingAddress(stakeAccount);
        b.amount('300000');
        b.validator(validator);
        return (await b.build()).toBroadcastFormat();
      },
    },
    {
      name: 'unstake / deactivate',
      build: async (feePayer, sender, durable) => {
        const b = factory.getStakingDeactivateBuilder();
        sponsor(b, feePayer, durable);
        b.sender(sender);
        b.stakingAddress(stakeAccount);
        return (await b.build()).toBroadcastFormat();
      },
    },
    {
      name: 'claim (withdraw rewards)',
      build: async (feePayer, sender, durable) => {
        const b = factory.getStakingWithdrawBuilder();
        sponsor(b, feePayer, durable);
        b.sender(sender);
        b.stakingAddress(stakeAccount);
        b.amount('300000');
        return (await b.build()).toBroadcastFormat();
      },
    },
    {
      name: 'delegate',
      build: async (feePayer, sender, durable) => {
        const b = factory.getStakingDelegateBuilder();
        sponsor(b, feePayer, durable);
        b.sender(sender);
        b.stakingAddress(stakeAccount);
        b.validator(validator);
        return (await b.build()).toBroadcastFormat();
      },
    },
    {
      name: 'closeAssociatedTokenAccount',
      exempt: true,
      build: async (feePayer, sender, durable) => {
        const b = factory.getCloseAtaInitializationBuilder();
        sponsor(b, feePayer, durable);
        b.sender(sender);
        b.accountAddress(nonceAccount);
        b.destinationAddress(root);
        b.authorityAddress(sender);
        return (await b.build()).toBroadcastFormat();
      },
    },
  ];

  for (const intent of intents) {
    describe(intent.name, function () {
      for (const useDurableNonce of [true, false]) {
        const mode = useDurableNonce ? 'on a durable nonce the fee address owns' : 'on a recent blockhash';

        it(`accepts the fee address as the only fee payer, ${mode}`, async function () {
          const txBase64 = await intent.build(feeAddress, root, useDurableNonce);
          should(await verify(txBase64, intent.txParams)).equal(true);
        });

        if (!intent.exempt) {
          it(`rejects it when the fee address is also the signer of the instructions, ${mode}`, async function () {
            const txBase64 = await intent.build(feeAddress, feeAddress, useDurableNonce);
            await verify(txBase64, intent.txParams).should.be.rejectedWith(NOT_ROOT_ERROR);
          });
        }
      }

      it('keeps the wallet root as an accepted fee payer', async function () {
        const txBase64 = await intent.build(root, root, true);
        const result = await verify(txBase64, intent.txParams).then(
          () => true,
          (e: Error) => e.message
        );
        // an unrelated check of the intent may reject it, but never the fee payer rule
        if (result !== true) {
          should(result).not.equal(NOT_ROOT_ERROR);
        }
      });
    });
  }
  it('rejects a token payment that sends the tokens to the fee address (its token account)', async function () {
    const b = factory.getTokenTransferBuilder();
    sponsor(b, feeAddress, true);
    b.sender(root);
    b.send({ address: feeAddress, amount: '1000', tokenName });
    const txBase64 = (await b.build()).toBroadcastFormat();
    await verify(txBase64).should.be.rejectedWith(NOT_ROOT_ERROR);
  });

  it('rejects a stake that hands its authority to the fee address', async function () {
    // the builder makes the wallet the staker and withdrawer, so the transaction is rebuilt with the fee address as
    // withdrawer: the parsed stake instruction does not show it, the raw instruction does
    const b = factory.getStakingActivateBuilder();
    sponsor(b, feeAddress, true);
    b.sender(root);
    b.stakingAddress(stakeAccount);
    b.amount('300000');
    b.validator(validator);
    const tx = (await b.build()) as Transaction;
    const instructions = tx.solTransaction.instructions;
    const initialize = instructions.find(
      (ix) => ix.programId.equals(StakeProgram.programId) && ix.data.readUInt32LE(0) === 0
    );
    should.exist(initialize);
    // overwrite the withdrawer (the second authority of Initialize) with the fee address
    const data = Buffer.from(initialize!.data);
    new PublicKey(feeAddress).toBuffer().copy(data, 4 + 32);
    initialize!.data = data;
    const txBase64 = Buffer.from(
      tx.solTransaction.serialize({ requireAllSignatures: false, verifySignatures: false })
    ).toString('base64');
    await verify(txBase64).should.be.rejectedWith(NOT_ROOT_ERROR);
  });
});
