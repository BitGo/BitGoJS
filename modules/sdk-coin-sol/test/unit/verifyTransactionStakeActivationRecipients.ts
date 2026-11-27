import 'should';
import { coins } from '@bitgo/statics';
import { BitGoBase, IWallet, resolveEffectiveTxParams, TransactionParams, TxRequest } from '@bitgo/sdk-core';

import { SolStakingTypeEnum } from '@bitgo/public-types';
import { PublicKey, SystemProgram, Transaction as Web3Transaction } from '@solana/web3.js';

import { KeyPair, Sol } from '../../src';
import { JITO_STAKE_POOL_ADDRESS } from '../../src/lib/constants';
import * as testData from '../resources/sol';
import { getBuilderFactory } from './getBuilderFactory';

/**
 * A stake activation funds a stake account that does not exist yet, so its intent has no recipient to name: staking
 * intents carry `recipients: []`, and the TSS signing step passes that on as an empty list. The fixtures are real
 * sponsored stake requests (native and Marinade); txParams is produced by the real resolveEffectiveTxParams from their
 * intents, so the signing-step call is reproduced exactly: transaction hex only, txParams from the intent.
 */
describe('SOL verifyTransaction: staking intents with an empty recipients list', function () {
  const basecoin = new Sol({ url: () => '' } as unknown as BitGoBase, coins.get('tsol'));

  const root = 'AiBA1tiM6mPh3dLJGqstj8TMKs4mP4TnJha2XAywK4GJ';
  const feeAddress = 'Hi4mwjkuCHKivY36Qh9LgWwgKq2VMpGwMu8h16XmCcpN';

  const wire = (messageHex: string): string => {
    const signatures = parseInt(messageHex.slice(0, 2), 16);
    return signatures.toString(16).padStart(2, '0') + '00'.repeat(64 * signatures) + messageHex;
  };

  const walletOf = (rootAddress: string, walletFeeAddress?: string): IWallet =>
    ({
      coinSpecific: () => ({ rootAddress }),
      toJSON: () => ({ ...(walletFeeAddress !== undefined && { feeAddress: walletFeeAddress }) }),
    } as unknown as IWallet);

  // Sponsored native stake: nonce advance, create + initialize + delegate the stake account; fee payer is the fee address.
  const nativeStake =
    '0300080cf8401280cd83b050cf455f6b5cb762eaa732264c1e6bad58eb520664bf8fcb1f26f01cd022b7f4ab17246e95e1b1267d83fa8f764b65f5c3600ee320f6e5146690457a71cd6b0e0d39fa10a85b8700cd62b8e1ea26b747266acbf99ea0e6c453d1a49ec26e11ca08e531c23aacc7f1dd7b5d73e35d3e9267e1162bdf4ded7ee0000000000000000000000000000000000000000000000000000000000000000006a1d8179137542a983437bdfe2a7ab2557f535c8a78722b68a49dc00000000006a1d817a502050b680791e6ce6db88e1e5b7150f61fc6790a4eb4d10000000006a7d51718c774c928566398691d5eb68b5eb8a39b4b6d5c73555b210000000006a7d517192c568ee08a845f73d29788cf035c3145b21ab344d8062ea940000006a7d517192c5c51218cc94c3d4af17f58daee089ba1fd44e3dbd98a0000000006a7d517193584d0feed9bb3431d13206be544281b57b8566cc5375ff40000000dc0911e8a79901e57b9b1c96cb3d4b68c4b93c1c0f2da1c03a7b2f177be85dfea4fac4755450bd690263c5e60c4546d8290b7cc4e3d9f1aa0ff77e9617683350404030308000404000000040202013400000000809fbd3b00000000c80000000000000006a1d8179137542a983437bdfe2a7ab2557f535c8a78722b68a49dc00000000005020109740000000090457a71cd6b0e0d39fa10a85b8700cd62b8e1ea26b747266acbf99ea0e6c45390457a71cd6b0e0d39fa10a85b8700cd62b8e1ea26b747266acbf99ea0e6c4530000000000000000000000000000000090457a71cd6b0e0d39fa10a85b8700cd62b8e1ea26b747266acbf99ea0e6c4530506010b070a06020402000000';
  const nativeIntent = {
    stakingRequestId: 'bdb3dcc5-0648-44e8-a1db-d78ab629f71b',
    validatorAddress: 'vgcDar2pryHvMgPkKaZfh8pQy4BJxv7SpwUG7zinWjG',
    amount: { value: '1002282880', symbol: 'tsol' },
    stakingType: 'NATIVE',
    recipients: [],
    intentType: 'stake',
  };

  // Sponsored Marinade stake (a deposit; the stake type is still StakingActivate) with its memo.
  const marinadeStake =
    '03000509f8401280cd83b050cf455f6b5cb762eaa732264c1e6bad58eb520664bf8fcb1f7f0161d7c42feb342cc77abd6d00473a6bb62d8eceadc4ba78c95927813e6fa190457a71cd6b0e0d39fa10a85b8700cd62b8e1ea26b747266acbf99ea0e6c453a6efa779d4609977145650ecedf8a509e21efa8002182833c2ab0eb447a816640000000000000000000000000000000000000000000000000000000000000000054a535a992921064d24e87160da387c7c35b5ddbc92bb81e41fa8404105448d06a1d8179137542a983437bdfe2a7ab2557f535c8a78722b68a49dc00000000006a7d517192c568ee08a845f73d29788cf035c3145b21ab344d8062ea940000006a7d517192c5c51218cc94c3d4af17f58daee089ba1fd44e3dbd98a00000000520a142b868adbf4d26a9060da1a885cec4a53366ac8a1a4e39de1502319b3aa040403030700040400000004020201340000000000ab904100000000c80000000000000006a1d8179137542a983437bdfe2a7ab2557f535c8a78722b68a49dc0000000000602010874000000000d094927814c05f19af71e4cd29f157a45403061b2bc0f457f341ff93814e7e290457a71cd6b0e0d39fa10a85b8700cd62b8e1ea26b747266acbf99ea0e6c4530000000000000000000000000000000090457a71cd6b0e0d39fa10a85b8700cd62b8e1ea26b747266acbf99ea0e6c45305004d7b22636f6465223a2248696d5751554b363164397778687737455975396a556a65377851694473346a4b65786154537675436d5845222c22616d6f756e74223a2231313030303030303030227d';
  const marinadeIntent = {
    stakingRequestId: '99d9e45b-e31e-4f56-b60d-4be7e30f8a80',
    memo: '{"code":"HimWQUK61d9wxhw7EYu9jUje7xQiDs4jKexaTSvuCmXE","amount":"1100000000"}',
    validatorAddress: 'stWirqFCf2Uts1JBL1Jsd3r6VBWhgnpdPxCTe1MFjrq',
    amount: { value: '1100000000', symbol: 'tsol' },
    stakingType: 'MARINADE',
    recipients: [],
    intentType: 'stake',
  };

  // The txParams the signing step builds from the persisted intent.
  const signingTxParams = (intent: Record<string, unknown>): TransactionParams =>
    resolveEffectiveTxParams({ intent } as unknown as TxRequest, undefined, 'tsol');

  const verifyAsSigningStep = (messageHex: string, txParams: TransactionParams, wallet: IWallet) =>
    basecoin.verifyTransaction({
      txPrebuild: { txHex: wire(messageHex) },
      txParams,
      wallet,
      walletType: 'tss',
    } as never);

  it('reproduces the signing step: the intent yields an empty, not an undefined, recipients list', function () {
    signingTxParams(nativeIntent).should.have.property('recipients').which.is.an.Array().with.length(0);
    signingTxParams(marinadeIntent).should.have.property('recipients').which.is.an.Array().with.length(0);
  });

  it('accepts a sponsored native stake', async function () {
    (await verifyAsSigningStep(nativeStake, signingTxParams(nativeIntent), walletOf(root, feeAddress))).should.equal(
      true
    );
  });

  it('accepts a sponsored Marinade stake', async function () {
    (
      await verifyAsSigningStep(marinadeStake, signingTxParams(marinadeIntent), walletOf(root, feeAddress))
    ).should.equal(true);
  });

  it('still requires the fee payer to be the root or the wallet fee address', async function () {
    await verifyAsSigningStep(nativeStake, signingTxParams(nativeIntent), walletOf(root)).should.be.rejectedWith(
      'Tx fee payer is not the wallet root address'
    );
    await verifyAsSigningStep(
      nativeStake,
      signingTxParams(nativeIntent),
      walletOf(root, testData.authAccount2.pub)
    ).should.be.rejectedWith('Tx fee payer is not the wallet root address');
  });

  it('still compares a non-empty recipients list with the transaction', async function () {
    await verifyAsSigningStep(
      nativeStake,
      { ...signingTxParams(nativeIntent), recipients: [{ address: testData.authAccount2.pub, amount: '1' }] },
      walletOf(root, feeAddress)
    ).should.be.rejectedWith('Tx outputs does not match with expected txParams recipients');
  });

  it('keeps rejecting a payment whose recipients list is empty', async function () {
    const payment =
      '020003076a1f673c71b295314b6730fe58461bf990e6627710c1fe5469f815005ed3576e9d7adfcf181fa620d9b917e4426cf8b10b43ea13f7d0424a2427d37b5a84db1d4eaec8e5ada99126fcbf569045c4c264a0793d0c7176d31844b128a82f728277914bfad6d7fe93ee60b3c3293d88663c2e9e55deeec135ced03d5fc48e73caea00000000000000000000000000000000000000000000000000000000000000000306466fe5211732ffecadba72c39be7bc8ce5bbc5f7126b2c439b3a4000000006a7d517192c568ee08a845f73d29788cf035c3145b21ab344d8062ea9400000254f6aa3da173e4669fcf037cd4233a97dc0a42be41050ad9aff52e63a334b05030403020600040400000005000903a086010000000000040201030c020000001027000000000000';
    await verifyAsSigningStep(
      payment,
      { type: 'payment', recipients: [] } as TransactionParams,
      walletOf('BbjgPhYfWUftiwNfYUYHpSxxn81BnntiU5NQs2GS8N4t', '89FzNa1iQh4fkm3ZPSeiwh8jq4fAPrPuY8AjcDBwgkms')
    ).should.be.rejectedWith('Number of tx outputs does not match with number of txParams recipients');
  });

  it('leaves a stake deactivation with an empty recipients list as it was: accepted', async function () {
    const factory = getBuilderFactory('tsol');
    const walletRoot = new KeyPair(testData.authAccount).getKeys().pub;
    const stakeAccount = new KeyPair(testData.stakeAccount).getKeys().pub;
    const builder = factory.getStakingDeactivateBuilder();
    builder.sender(walletRoot).stakingAddress(stakeAccount).nonce(testData.blockHashes.validBlockHashes[0]);
    const txBase64 = (await builder.build()).toBroadcastFormat();
    (
      await basecoin.verifyTransaction({
        txPrebuild: { txBase64 },
        txParams: { type: 'unstake', recipients: [] } as TransactionParams,
        wallet: walletOf(walletRoot),
      } as never)
    ).should.equal(true);
  });

  describe('other staking intents with an empty recipients list', function () {
    const factory = getBuilderFactory('tsol');
    const walletRoot = new KeyPair(testData.authAccount).getKeys().pub;
    const stakeAccount = new KeyPair(testData.stakeAccount).getKeys().pub;
    const splitAccount = new KeyPair(testData.splitStakeAccount).getKeys().pub;
    const nonce = testData.blockHashes.validBlockHashes[0];

    const partialUnstake = async () =>
      (
        await factory
          .getStakingDeactivateBuilder()
          .sender(walletRoot)
          .stakingAddress(stakeAccount)
          .unstakingAddress(splitAccount)
          .amount('100000')
          .nonce(nonce)
          .build()
      ).toBroadcastFormat();
    const claim = async () =>
      (
        await factory
          .getStakingWithdrawBuilder()
          .sender(walletRoot)
          .stakingAddress(stakeAccount)
          .amount('300000')
          .nonce(nonce)
          .build()
      ).toBroadcastFormat();
    const delegate = async () =>
      (
        await factory
          .getStakingDelegateBuilder()
          .sender(walletRoot)
          .stakingAddress(stakeAccount)
          .validator(splitAccount)
          .nonce(nonce)
          .build()
      ).toBroadcastFormat();

    const verify = (txBase64: string, txParams: Record<string, unknown>) =>
      basecoin.verifyTransaction({ txPrebuild: { txBase64 }, txParams, wallet: walletOf(walletRoot) } as never);

    it('accepts a partial unstake', async function () {
      (await verify(await partialUnstake(), { type: 'unstake', recipients: [] })).should.equal(true);
    });

    it('accepts a claim', async function () {
      (await verify(await claim(), { type: 'claim', recipients: [] })).should.equal(true);
    });

    it('accepts a delegate', async function () {
      (await verify(await delegate(), { type: 'delegate', recipients: [] })).should.equal(true);
    });

    // A deactivation may legitimately carry a transfer, so the parser alone does not reject an appended one: the empty
    // recipients list must not hide it.
    const withTransferToAttacker = (txBase64: string): string => {
      const tx = Web3Transaction.from(Buffer.from(txBase64, 'base64'));
      tx.add(
        SystemProgram.transfer({
          fromPubkey: new PublicKey(walletRoot),
          toPubkey: new PublicKey(testData.authAccount2.pub),
          lamports: 5_000_000_000,
        })
      );
      return tx.serialize({ requireAllSignatures: false, verifySignatures: false }).toString('base64');
    };

    const jitoUnstake = async () =>
      (
        await factory
          .getStakingDeactivateBuilder()
          .sender(walletRoot)
          .stakingAddress(JITO_STAKE_POOL_ADDRESS)
          .unstakingAddress(stakeAccount)
          .stakingType(SolStakingTypeEnum.JITO)
          .extraParams({
            validatorAddress: testData.JITO_STAKE_POOL_VALIDATOR_ADDRESS,
            transferAuthorityAddress: splitAccount,
            stakePoolData: {
              managerFeeAccount: testData.JITO_STAKE_POOL_DATA_PARSED.managerFeeAccount.toString(),
              poolMint: testData.JITO_STAKE_POOL_DATA_PARSED.poolMint.toString(),
              validatorListAccount: testData.JITO_STAKE_POOL_DATA_PARSED.validatorList.toString(),
            },
          })
          .amount('1000')
          .nonce(nonce)
          .build()
      ).toBroadcastFormat();

    it('accepts a Jito unstake', async function () {
      (await verify(await jitoUnstake(), { type: 'unstake', recipients: [] })).should.equal(true);
    });

    it('rejects a partial unstake with a transfer to another address appended', async function () {
      await verify(withTransferToAttacker(await partialUnstake()), {
        type: 'unstake',
        recipients: [],
      }).should.be.rejectedWith('Number of tx outputs does not match with number of txParams recipients');
    });

    it('rejects a Jito unstake with a transfer to another address appended', async function () {
      await verify(withTransferToAttacker(await jitoUnstake()), {
        type: 'unstake',
        recipients: [],
      }).should.be.rejectedWith('Number of tx outputs does not match with number of txParams recipients');
    });

    it('still compares a non-empty recipients list for a partial unstake and a claim', async function () {
      const other = [{ address: walletRoot, amount: '1' }];
      await verify(await partialUnstake(), { type: 'unstake', recipients: other }).should.be.rejected();
      await verify(await claim(), { type: 'claim', recipients: other }).should.be.rejected();
    });
  });
});
