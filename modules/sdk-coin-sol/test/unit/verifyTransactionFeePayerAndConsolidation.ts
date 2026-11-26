import 'should';
import { coins } from '@bitgo/statics';
import { BitGoBase, IWallet, TransactionParams } from '@bitgo/sdk-core';
import { PublicKey, SystemProgram, Transaction as SolTransaction, TransactionInstruction } from '@solana/web3.js';

import { KeyPair, Sol } from '../../src';
import * as testData from '../resources/sol';
import { getBuilderFactory } from './getBuilderFactory';

/**
 * verifyTransaction for sponsored (enterprise fee address) and non-sponsored SOL transactions, and for consolidations
 * that only the TSS signing step can recognise.
 *
 * The signing step re-verifies from the transaction request alone: the prebuild is just the serialized transaction and
 * txParams comes from the persisted intent (type and recipients). The fixtures below are real transaction requests, so
 * they are rebuilt as unsigned wire transactions from their signable message and verified in exactly that shape.
 *
 * Like the other verify tests that avoid TestBitGo, these do not need the CI-only BITGOJS_TEST_PASSWORD secret.
 */
describe('SOL verifyTransaction: sponsored fee payer and consolidation by txParams.type', function () {
  const basecoin = new Sol({ url: () => '' } as unknown as BitGoBase, coins.get('tsol'));

  // Wire format: compact-u16 signature count, zeroed signatures, then the message.
  const wire = (messageHex: string): string => {
    const signatures = parseInt(messageHex.slice(0, 2), 16);
    return signatures.toString(16).padStart(2, '0') + '00'.repeat(64 * signatures) + messageHex;
  };

  const walletOf = (rootAddress: string, feeAddress?: string): IWallet =>
    ({
      coinSpecific: () => ({ rootAddress }),
      toJSON: () => ({ ...(feeAddress !== undefined && { feeAddress }) }),
    } as unknown as IWallet);

  // Only coinSpecific(): a wallet built from partial data has no toJSON.
  const walletWithoutToJSON = (rootAddress: string): IWallet =>
    ({ coinSpecific: () => ({ rootAddress }) } as unknown as IWallet);

  // The shape the TSS signing step uses.
  const verifyAsSigningStep = (messageHex: string, txParams: Record<string, unknown>, wallet: IWallet) =>
    basecoin.verifyTransaction({
      txPrebuild: { txHex: wire(messageHex) },
      txParams: txParams as TransactionParams,
      wallet,
      walletType: 'tss',
    } as never);

  const FEE_PAYER_ERROR = 'Tx fee payer is not the wallet root address';

  describe('sponsored transactions (fee payer is the wallet record fee address)', function () {
    const root = 'BbjgPhYfWUftiwNfYUYHpSxxn81BnntiU5NQs2GS8N4t';
    const feeAddress = '89FzNa1iQh4fkm3ZPSeiwh8jq4fAPrPuY8AjcDBwgkms';

    // Sponsored native payment: nonce advance, priority fee, transfer; fee payer is the fee address.
    const payment =
      '020003076a1f673c71b295314b6730fe58461bf990e6627710c1fe5469f815005ed3576e9d7adfcf181fa620d9b917e4426cf8b10b43ea13f7d0424a2427d37b5a84db1d4eaec8e5ada99126fcbf569045c4c264a0793d0c7176d31844b128a82f728277914bfad6d7fe93ee60b3c3293d88663c2e9e55deeec135ced03d5fc48e73caea00000000000000000000000000000000000000000000000000000000000000000306466fe5211732ffecadba72c39be7bc8ce5bbc5f7126b2c439b3a4000000006a7d517192c568ee08a845f73d29788cf035c3145b21ab344d8062ea9400000254f6aa3da173e4669fcf037cd4233a97dc0a42be41050ad9aff52e63a334b05030403020600040400000005000903a086010000000000040201030c020000001027000000000000';
    const paymentParams = {
      type: 'payment',
      recipients: [{ address: 'AnBKANkokSpeqYAz33xYgXTjiNGK5X7WMvX4DqXc5pk1', amount: '10000' }],
    };

    it('accepts a sponsored payment when the fee payer is the wallet fee address', async function () {
      (await verifyAsSigningStep(payment, paymentParams, walletOf(root, feeAddress))).should.equal(true);
    });

    it('rejects it when the wallet has no fee address, exactly as before', async function () {
      await verifyAsSigningStep(payment, paymentParams, walletOf(root)).should.be.rejectedWith(FEE_PAYER_ERROR);
    });

    it('rejects it when the wallet has a different fee address', async function () {
      await verifyAsSigningStep(
        payment,
        paymentParams,
        walletOf(root, testData.authAccount2.pub)
      ).should.be.rejectedWith(FEE_PAYER_ERROR);
    });

    it('rejects it for a wallet object without toJSON, without throwing a TypeError', async function () {
      await verifyAsSigningStep(payment, paymentParams, walletWithoutToJSON(root)).should.be.rejectedWith(
        FEE_PAYER_ERROR
      );
    });

    it('still rejects when the recipients do not match, whoever pays the fee', async function () {
      await verifyAsSigningStep(
        payment,
        { ...paymentParams, recipients: [{ address: paymentParams.recipients[0].address, amount: '10001' }] },
        walletOf(root, feeAddress)
      ).should.be.rejectedWith('Tx outputs does not match with expected txParams recipients');
    });

    it('keeps the declared fee payer an exact match, with or without a wallet fee address', async function () {
      (await verifyAsSigningStep(payment, { ...paymentParams, feePayer: feeAddress }, walletOf(root))).should.equal(
        true
      );
      await verifyAsSigningStep(
        payment,
        { ...paymentParams, feePayer: root },
        walletOf(root, feeAddress)
      ).should.be.rejectedWith(/does not match the declared sponsored fee payer/);
    });
  });

  describe('transaction types the wallet fee address may not pay for', function () {
    const factory = getBuilderFactory('tsol');
    const root = new KeyPair(testData.authAccount).getKeys().pub;
    const feeAddress = new KeyPair(testData.authAccount2).getKeys().pub;
    const stakeAccount = new KeyPair(testData.stakeAccount).getKeys().pub;
    const blockHash = testData.blockHashes.validBlockHashes[0];

    it('rejects a stake authorize paid by the wallet fee address', async function () {
      const builder = factory.getStakingAuthorizeBuilder();
      builder
        .sender(root)
        .stakingAddress(stakeAccount)
        .newAuthorizedAddress(root)
        .oldAuthorizedAddress(root)
        .nonce(blockHash)
        .feePayer(feeAddress);
      const tx = await builder.build();
      await basecoin
        .verifyTransaction({
          txPrebuild: { txBase64: tx.toBroadcastFormat() },
          txParams: {},
          wallet: walletOf(root, feeAddress),
        } as never)
        .should.be.rejectedWith(FEE_PAYER_ERROR);
    });

    it('still accepts the same authorize when the wallet root pays', async function () {
      const builder = factory.getStakingAuthorizeBuilder();
      builder
        .sender(root)
        .stakingAddress(stakeAccount)
        .newAuthorizedAddress(root)
        .oldAuthorizedAddress(root)
        .nonce(blockHash);
      const tx = await builder.build();
      (
        await basecoin.verifyTransaction({
          txPrebuild: { txBase64: tx.toBroadcastFormat() },
          txParams: {},
          wallet: walletOf(root, feeAddress),
        } as never)
      ).should.equal(true);
    });
  });

  describe('consolidations recognised only by txParams.type', function () {
    const root = 'BbjgPhYfWUftiwNfYUYHpSxxn81BnntiU5NQs2GS8N4t';
    const feeAddress = '89FzNa1iQh4fkm3ZPSeiwh8jq4fAPrPuY8AjcDBwgkms';

    // Sponsored consolidateToken (Token-2022 mint): nonce advance, priority fee, create ATA, token transfer to the
    // root's token account. The intent recipient is the root with the token amount.
    const consolidateToken =
      '0201070c6a1f673c71b295314b6730fe58461bf990e6627710c1fe5469f815005ed3576e6f96664ff1cf316cc4bdc94ccf1114dc739b8ec5b1f263c5e03a3171dd9861ec262cfbd5dc642e3a6c044220a4fe83d465d01bb6ebf3d511acb232cd56b513d030a70f04a4ffc1fadcd341dcd116864cb6b9fd5f3c3a662666d1e7e5d25d27049bc06c28bba991b56213610a4636b9da381072fe2677cd7d08ef7fdf333b8bbb000000000000000000000000000000000000000000000000000000000000000040eb17d8a12e56358b533dde4d338d6d25dc1daf0a30a76ed1ca827eb49e35e78c97258f4e2489f1bb3d1029148e0d830b5a1399daff1084048e7bd8dbe9f8599d7adfcf181fa620d9b917e4426cf8b10b43ea13f7d0424a2427d37b5a84db1d0306466fe5211732ffecadba72c39be7bc8ce5bbc5f7126b2c439b3a4000000006a7d517192c568ee08a845f73d29788cf035c3145b21ab344d8062ea940000006ddf6e1ee758fde18425dbce46ccddab61afc4d83b90d27febdf928d8a18bfcfad11b2bc628b29a09a7bc3af1693aa106ef3da20164e40e87f71651e2289e67040503030a00040400000009000903a086010000000000070600040806050b01010b04020604010a0c140000000000000009';
    const consolidateTokenParams = {
      type: 'consolidateToken',
      recipients: [{ address: root, amount: '20', tokenName: 'tsol:t22mint' }],
    };

    // Sponsored legacy consolidate that sweeps a token only: the intent has one native recipient with a negative amount.
    const legacyTokenOnly =
      '0201050a6a1f673c71b295314b6730fe58461bf990e6627710c1fe5469f815005ed3576e7161677b621c06564032ce134ea86c8c79b4e2f9647c49ef3bf480952e222a4b89d2080dd10cb310157f892c579454a14bcd2668aecd773d3b9cac1b20642e2d9bc06c28bba991b56213610a4636b9da381072fe2677cd7d08ef7fdf333b8bbba72c23abb3cde7cc532c4cbb279d840c5ce2b24a9e2f7015d562b0886963a7c8000000000000000000000000000000000000000000000000000000000000000040eb17d8a12e56358b533dde4d338d6d25dc1daf0a30a76ed1ca827eb49e35e70306466fe5211732ffecadba72c39be7bc8ce5bbc5f7126b2c439b3a4000000006a7d517192c568ee08a845f73d29788cf035c3145b21ab344d8062ea940000006ddf6e1ee758fde18425dbce46ccddab61afc4d83b90d27febdf928d8a18bfc4d58bb43e6a9b7b35f691802341f842a3e52c546e26967d03fb5a3ca3f556662030503020800040400000007000903a0860100000000000904040603010a0c190000000000000009';
    const legacyTokenOnlyParams = {
      type: 'consolidate',
      recipients: [{ address: root, amount: '-10000' }],
    };

    // Non-sponsored legacy multi-asset consolidate: native transfer plus token transfer, paid by the swept address.
    const legacyMultiAsset =
      '0201040ad529ef9b0ee2cab7362ddd4bdb2cd42c968281207069104c9bf99379643fcb871c96172044f1217c3784e8f02f49e2c8fc3591e81294ab54394f9d22fd7b7a8f2ec379de7ec9905f593470b2cb5a8751a056ccb1fd2ef5d090b74c7a6e13cb253cb67ce1e5a82197e2a23885373e32b73880ef45d219209cd81bbf54b1420cb7669150ae039051bca30b10a5213bb3d7fd0e3b75624fb048e1fad3220c8e19c1bd9500108c343ab57ce1cac14fe88b6ac274e6c54805f992a5d98079b7f215a3000000000000000000000000000000000000000000000000000000000000000006a7d517192c568ee08a845f73d29788cf035c3145b21ab344d8062ea940000006ddf6e1d765a193d9cbe146ceeb79ac1cb485ed5f5b37913a8cf5857eff00a93b442cb3912157f13a933d0134282d032b5ffecd01a2dbf1b7790608df002ea701b9d11fd06f725d42da376ba06fd4d4608cced645b96022c74cf42f0ee692780306030407010404000000060200050c0200000040640100000000000804020903000a0c508b01000000000006';
    const multiAssetRoot = 'Dm3qE1x7AGkuvkpRZ6UapnYedn9minkMr7JFSazGAnjL';
    const multiAssetParams = {
      type: 'consolidate',
      recipients: [{ address: multiAssetRoot, amount: '86200' }],
    };

    it('accepts a sponsored consolidateToken (fee payer is the fee address)', async function () {
      (await verifyAsSigningStep(consolidateToken, consolidateTokenParams, walletOf(root, feeAddress))).should.equal(
        true
      );
    });

    it('accepts it for a wallet without a fee address too: a consolidation fee payer is never the wallet root', async function () {
      (await verifyAsSigningStep(consolidateToken, consolidateTokenParams, walletOf(root))).should.equal(true);
    });

    it('accepts a sponsored legacy consolidate whose intent amount cannot match the swept token', async function () {
      (await verifyAsSigningStep(legacyTokenOnly, legacyTokenOnlyParams, walletOf(root, feeAddress))).should.equal(
        true
      );
    });

    it('accepts a non-sponsored legacy multi-asset consolidate paid by the swept address', async function () {
      (await verifyAsSigningStep(legacyMultiAsset, multiAssetParams, walletOf(multiAssetRoot))).should.equal(true);
    });

    it('rejects the consolidation when its funds do not go to the wallet root', async function () {
      await verifyAsSigningStep(
        legacyMultiAsset,
        multiAssetParams,
        walletOf(testData.authAccount.pub)
      ).should.be.rejectedWith('tx outputs does not match with expected address');
      await verifyAsSigningStep(
        consolidateToken,
        consolidateTokenParams,
        walletOf(testData.authAccount.pub, feeAddress)
      ).should.be.rejectedWith('tx outputs does not match with expected address');
    });

    it('rejects a payment to someone else that is merely labelled a consolidation', async function () {
      const sponsoredPayment =
        '020003076a1f673c71b295314b6730fe58461bf990e6627710c1fe5469f815005ed3576e9d7adfcf181fa620d9b917e4426cf8b10b43ea13f7d0424a2427d37b5a84db1d4eaec8e5ada99126fcbf569045c4c264a0793d0c7176d31844b128a82f728277914bfad6d7fe93ee60b3c3293d88663c2e9e55deeec135ced03d5fc48e73caea00000000000000000000000000000000000000000000000000000000000000000306466fe5211732ffecadba72c39be7bc8ce5bbc5f7126b2c439b3a4000000006a7d517192c568ee08a845f73d29788cf035c3145b21ab344d8062ea9400000254f6aa3da173e4669fcf037cd4233a97dc0a42be41050ad9aff52e63a334b05030403020600040400000005000903a086010000000000040201030c020000001027000000000000';
      await verifyAsSigningStep(
        sponsoredPayment,
        { type: 'consolidate', recipients: [{ address: root, amount: '10000' }] },
        walletOf(root, feeAddress)
      ).should.be.rejectedWith('tx outputs does not match with expected address');
    });

    it('does not apply when the wallet root pays: the strict recipient comparison stays', async function () {
      const factory = getBuilderFactory('tsol');
      const walletRoot = new KeyPair(testData.authAccount).getKeys().pub;
      const destination = new KeyPair(testData.authAccount2).getKeys().pub;
      const builder = factory.getTransferBuilder();
      builder.sender(walletRoot).nonce(testData.blockHashes.validBlockHashes[0]);
      builder.send({ address: destination, amount: '1000' });
      const txHex = Buffer.from((await builder.build()).toBroadcastFormat(), 'base64').toString('hex');

      const verify = (amount: string) =>
        basecoin.verifyTransaction({
          txPrebuild: { txHex },
          txParams: { type: 'consolidate', recipients: [{ address: destination, amount }] },
          wallet: walletOf(walletRoot),
        } as never);

      (await verify('1000')).should.equal(true);
      await verify('999').should.be.rejectedWith('Tx outputs does not match with expected txParams recipients');
    });

    it('keeps a declared fee payer an exact match, as on master', async function () {
      (
        await verifyAsSigningStep(
          consolidateToken,
          { ...consolidateTokenParams, feePayer: feeAddress },
          walletOf(root, feeAddress)
        )
      ).should.equal(true);
      await verifyAsSigningStep(
        consolidateToken,
        { ...consolidateTokenParams, feePayer: root },
        walletOf(root, feeAddress)
      ).should.be.rejectedWith(/does not match the declared sponsored fee payer/);
      await verifyAsSigningStep(
        legacyMultiAsset,
        { ...multiAssetParams, feePayer: feeAddress },
        walletOf(multiAssetRoot)
      ).should.be.rejectedWith(/does not match the declared sponsored fee payer/);
    });

    it('treats an empty declared fee payer as undeclared, as on master', async function () {
      (
        await verifyAsSigningStep(consolidateToken, { ...consolidateTokenParams, feePayer: '' }, walletOf(root))
      ).should.equal(true);
    });

    describe('transactions built around the swept address', function () {
      const sweptAddress = new KeyPair(testData.authAccount2).getKeys().pub;
      const walletRoot = new KeyPair(testData.authAccount).getKeys().pub;
      const attacker = new KeyPair({ prv: testData.prvKeys.prvKey1.base58 }).getKeys().pub;
      const blockhash = testData.blockHashes.validBlockHashes[0];

      const transferTo = (to: string): TransactionInstruction =>
        SystemProgram.transfer({
          fromPubkey: new PublicKey(sweptAddress),
          toPubkey: new PublicKey(to),
          lamports: 1000,
        });

      // Unsigned legacy transaction paid by the swept address, as hex.
      const paidBySweptAddress = (instructions: TransactionInstruction[]): string =>
        new SolTransaction({ feePayer: new PublicKey(sweptAddress), recentBlockhash: blockhash })
          .add(...instructions)
          .serialize({ requireAllSignatures: false, verifySignatures: false })
          .toString('hex');

      const verifyRaw = (txHex: string) =>
        basecoin.verifyTransaction({
          txPrebuild: { txHex },
          txParams: { type: 'consolidate' } as TransactionParams,
          wallet: walletOf(walletRoot),
          walletType: 'tss',
        } as never);

      it('accepts a consolidation whose every output goes to the wallet root', async function () {
        (await verifyRaw(paidBySweptAddress([transferTo(walletRoot)]))).should.equal(true);
      });

      it('rejects it when only one of several outputs goes elsewhere', async function () {
        await verifyRaw(paidBySweptAddress([transferTo(walletRoot), transferTo(attacker)])).should.be.rejectedWith(
          'tx outputs does not match with expected address'
        );
      });

      it('rejects a transfer to the root that carries an instruction the parser does not know', async function () {
        const unknownInstruction = new TransactionInstruction({
          keys: [{ pubkey: new PublicKey(sweptAddress), isSigner: true, isWritable: true }],
          programId: new PublicKey(attacker),
          data: Buffer.from([1, 2, 3]),
        });
        await verifyRaw(paidBySweptAddress([transferTo(walletRoot), unknownInstruction])).should.be.rejectedWith(
          /instruction type not supported/
        );
      });
    });

    it('leaves the consolidateId path unchanged: the fee payer check is skipped, as before', async function () {
      (
        await basecoin.verifyTransaction({
          txPrebuild: { txHex: wire(consolidateToken), consolidateId: 'abc123' },
          txParams: {},
          wallet: walletOf(root),
          verification: { consolidationToBaseAddress: true },
          walletType: 'tss',
        } as never)
      ).should.equal(true);
    });
  });
});
