import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

import type { IWallet } from '@bitgo/sdk-core';
import * as utxolib from '@bitgo/utxo-lib';

import {
  assertEarlyExitMaterials,
  decodePsbt,
  descriptorDetails,
  latestBlockHeight,
  makePox5ExitBuildParams,
  makePox5StakingBuildParams,
  networkForCoin,
  replacePsbt,
  signAndSubmit,
  signEarlyExitBranch,
  transactionSummary,
} from './api-cli';
import { getPox5WalletSpecific, outpointFromUnspent, redactBitGoError, responseUnspents } from './bitgo-api';
import {
  authenticateBitGoApi,
  createOrGetFakeStakeWallet,
  faucetFundWallet,
  findSufficientWalletUnspent,
  loadBitGoApiIntegrationContext,
  type BitGoApiIntegrationContext,
  type IndexedWalletUnspent,
  waitForWalletUnspent,
} from './bitgo-api.integration-support';
import { derivePox5FakeStakeMaterials } from './fake-stake';
import { waitFor } from './rpc';

const fakeStakeAmountSats = '30000';

async function submitControlledEarlyExit(args: {
  context: BitGoApiIntegrationContext;
  mainWallet: IWallet;
  pairedWallet: IWallet;
  outpoint: string;
  principalPreimage: Buffer;
  earlyExitKey: utxolib.ECPairInterface;
  walletPassphrase: string;
  network: ReturnType<typeof networkForCoin>;
}): Promise<{ txid: string; recoveredUnspent: IndexedWalletUnspent }> {
  const { address } = await args.mainWallet.createAddress();
  assert.ok(typeof address === 'string' && address.length > 0);
  const prebuild = await args.pairedWallet.prebuildTransaction(
    makePox5ExitBuildParams({
      address,
      outpoint: args.outpoint,
      branch: 'early',
      principalPreimage: args.principalPreimage,
    })
  );
  const psbt = decodePsbt(prebuild, args.network);
  assert.equal(psbt.txInputs.length, 1, 'Early-exit PSBT must spend exactly the selected stake output');
  assert.equal(psbt.locktime, 0, 'Early-exit PSBT must use the controlled preimage branch');
  const locallySignedPsbt = signEarlyExitBranch(psbt, args.earlyExitKey, args.network);
  const review = transactionSummary(prebuild, locallySignedPsbt, args.network);
  const submission = await signAndSubmit(
    args.pairedWallet,
    replacePsbt(prebuild, locallySignedPsbt),
    args.walletPassphrase
  );
  const txid = typeof submission.txid === 'string' ? submission.txid : review.txid;
  assert.equal(txid, review.txid, 'Submitted exit txid differs from its PSBT txid');
  await args.context.funding.waitForConfirmed(txid);
  const recoveredUnspent = await waitForWalletUnspent(args.context, args.mainWallet, txid, address);
  await waitFor(
    `BitGo to remove spent stake outpoint ${args.outpoint}`,
    async () =>
      !responseUnspents(await args.pairedWallet.unspents({ limit: 100 })).some(
        (unspent) => outpointFromUnspent(unspent) === args.outpoint
      ),
    args.context.config.bitcoin.startupTimeoutMs,
    15_000
  );
  return { txid, recoveredUnspent };
}

async function recoverInterruptedFakeStakes(args: {
  context: BitGoApiIntegrationContext;
  mainWallet: IWallet;
  principalPreimage: Buffer;
  earlyExitKey: utxolib.ECPairInterface;
  walletPassphrase: string;
  network: ReturnType<typeof networkForCoin>;
}): Promise<void> {
  const pairedWalletId = getPox5WalletSpecific(args.mainWallet)?.pairedWalletId;
  if (typeof pairedWalletId !== 'string') return;
  const pairedWallet = await args.context.bitgo.coin(args.context.coinName).wallets().get({ id: pairedWalletId });
  const unspents = responseUnspents(await pairedWallet.unspents({ limit: 100, minConfirms: 1 }));
  if (unspents.length === 0) return;

  const expectedCommitment = createHash('sha256').update(args.principalPreimage).digest();
  const descriptor = descriptorDetails(pairedWallet).find(
    (candidate) =>
      candidate.stakerCommitment.equals(expectedCommitment) &&
      candidate.earlyExitKey.equals(args.earlyExitKey.publicKey)
  );
  assert.ok(descriptor, 'Existing fake-stake outputs do not match the deterministic recovery material');
  assertEarlyExitMaterials(args.principalPreimage, args.earlyExitKey.publicKey, descriptor);
  console.log(`Recovering ${unspents.length} interrupted fake-stake output(s) from ${pairedWalletId}`);

  for (const unspent of unspents) {
    const outpoint = outpointFromUnspent(unspent);
    assert.ok(outpoint, 'Paired-wallet unspent is missing its transaction outpoint');
    const { txid } = await submitControlledEarlyExit({
      context: args.context,
      mainWallet: args.mainWallet,
      pairedWallet,
      outpoint,
      principalPreimage: args.principalPreimage,
      earlyExitKey: args.earlyExitKey,
      walletPassphrase: args.walletPassphrase,
      network: args.network,
    });
    console.log(`Recovered interrupted fake-stake output ${outpoint} with ${txid}`);
  }
}

describe('BitGo API PoX-5 fake-stake integration', function () {
  it('builds, submits, and early-exits a controlled BTC-only PoX-5 stake', async function (this: Mocha.Context) {
    const context = loadBitGoApiIntegrationContext();
    const walletPassphrase = process.env.BITGO_WALLET_PASSPHRASE;
    if (!walletPassphrase) throw new Error('BITGO_WALLET_PASSPHRASE is required for the fake-stake integration test');
    const network = networkForCoin(context.coinName);
    const materials = derivePox5FakeStakeMaterials(walletPassphrase, context.environment, context.coinName, network);
    const secrets = [
      context.token,
      walletPassphrase,
      materials.principalPreimage.toString('hex'),
      materials.earlyExitKey.privateKey ? Buffer.from(materials.earlyExitKey.privateKey).toString('hex') : '',
    ];
    this.timeout(context.config.bitcoin.startupTimeoutMs * 9 + context.config.bitcoin.timeoutMs * 2);

    let step = 'authenticate BitGo API';
    try {
      await authenticateBitGoApi(context);
      step = 'select the dedicated fake-stake wallet';
      const selected = await createOrGetFakeStakeWallet(context, walletPassphrase);
      const mainWallet = selected.wallet;
      console.log(`Using dedicated fake-stake wallet ${mainWallet.id()} on ${context.coinName}`);
      step = 'recover interrupted fake stakes';
      await recoverInterruptedFakeStakes({
        context,
        mainWallet,
        principalPreimage: materials.principalPreimage,
        earlyExitKey: materials.earlyExitKey,
        walletPassphrase,
        network,
      });

      step = 'find or request confirmed funding';
      const minimumFundingSats = BigInt(fakeStakeAmountSats) + 10_000n;
      const existingFundingInput = await findSufficientWalletUnspent(mainWallet, minimumFundingSats.toString());
      const fundingInput = existingFundingInput ?? (await faucetFundWallet(context, mainWallet));
      assert.ok(
        BigInt(fundingInput.amountSats) >= minimumFundingSats,
        `Wallet input ${fundingInput.outpoint} is too small for the fake stake and transaction fee`
      );
      console.log(
        existingFundingInput
          ? `Reusing confirmed wallet input ${fundingInput.outpoint}`
          : `Using confirmed faucet input ${fundingInput.outpoint}`
      );

      step = 'fetch current Bitcoin block height';
      const unlockHeight = (await latestBlockHeight(mainWallet.baseCoin)) + 1;
      step = 'build Wallet Platform fake-stake transaction';
      const stakingParams = makePox5StakingBuildParams({
        amountSats: fakeStakeAmountSats,
        unlockHeight,
        principalPreimage: materials.principalPreimage,
        earlyExitKey: materials.earlyExitKey.publicKey,
        unspents: [fundingInput.outpoint],
      });
      const stakePrebuild = await mainWallet.prebuildTransaction(stakingParams);
      const stakePsbt = decodePsbt(stakePrebuild, network);
      const stakeReview = transactionSummary(stakePrebuild, stakePsbt, network);
      assert.ok(
        stakeReview.outputs.some((output) => output.amountSats === fakeStakeAmountSats),
        'Stake prebuild did not include the requested PoX-5 lockup output'
      );

      const refreshedMainWallet = await context.bitgo.coin(context.coinName).wallets().get({ id: mainWallet.id() });
      const pairedWalletId = getPox5WalletSpecific(refreshedMainWallet)?.pairedWalletId;
      assert.ok(typeof pairedWalletId === 'string', 'PoX-5 build did not create a paired staking wallet');
      const pairedWallet = await context.bitgo.coin(context.coinName).wallets().get({ id: pairedWalletId });
      assert.equal(getPox5WalletSpecific(pairedWallet)?.pairedWalletId, mainWallet.id());
      const descriptor = descriptorDetails(pairedWallet).find((item) => item.unlockHeight === unlockHeight);
      assert.ok(descriptor, 'Paired wallet is missing the expected minimal-locktime PoX-5 descriptor');
      assertEarlyExitMaterials(materials.principalPreimage, materials.earlyExitKey.publicKey, descriptor);

      step = 'sign and submit the fake stake';
      const stakeSubmission = await signAndSubmit(mainWallet, stakePrebuild, walletPassphrase);
      const submittedStakeTxid = typeof stakeSubmission.txid === 'string' ? stakeSubmission.txid : stakeReview.txid;
      assert.equal(submittedStakeTxid, stakeReview.txid, 'Submitted stake txid differs from its PSBT txid');
      console.log(`Submitted fake stake ${submittedStakeTxid}; paired wallet ${pairedWalletId}`);
      step = 'wait for fake-stake confirmation and BitGo indexing';
      const stakeConfirmation = await context.funding.waitForConfirmed(submittedStakeTxid);
      const stakedUnspent = await waitForWalletUnspent(context, pairedWallet, submittedStakeTxid);
      console.log(
        `BitGo indexed stake ${stakedUnspent.outpoint} at ${stakeConfirmation.blockHeight} (${stakeConfirmation.blockHash})`
      );

      step = 'wait for the minimal unlock height';
      await waitFor(
        `Bitcoin height to reach minimal PoX-5 unlock height ${unlockHeight}`,
        async () => (await latestBlockHeight(pairedWallet.baseCoin)) >= unlockHeight,
        context.config.bitcoin.startupTimeoutMs,
        15_000
      );

      step = 'build the late-exit transaction';
      const { address: recoveryAddress } = await mainWallet.createAddress();
      assert.ok(typeof recoveryAddress === 'string' && recoveryAddress.length > 0);
      const latePrebuild = await pairedWallet.prebuildTransaction(
        makePox5ExitBuildParams({
          address: recoveryAddress,
          outpoint: stakedUnspent.outpoint,
          branch: 'late',
        })
      );
      const latePsbt = decodePsbt(latePrebuild, network);
      assert.equal(latePsbt.txInputs.length, 1);
      assert.equal(latePsbt.locktime, unlockHeight, 'Late-exit PSBT did not use the descriptor CLTV height');

      step = 'sign and submit the controlled early exit';
      const earlyExit = await submitControlledEarlyExit({
        context,
        mainWallet,
        pairedWallet,
        outpoint: stakedUnspent.outpoint,
        principalPreimage: materials.principalPreimage,
        earlyExitKey: materials.earlyExitKey,
        walletPassphrase,
        network,
      });
      const submittedExitTxid = earlyExit.txid;
      console.log(`Submitted controlled early exit ${submittedExitTxid} to ${mainWallet.id()}`);
      step = 'verify BTC recovery';
      const recoveredUnspent = earlyExit.recoveredUnspent;
      assert.ok(BigInt(recoveredUnspent.amountSats) > 0n, 'Early exit did not return BTC to the main wallet');
      console.log(`Fake-stake round trip complete; ${recoveredUnspent.amountSats} sats returned to the main wallet`);
    } catch (error) {
      throw new Error(`Failed to ${step}: ${redactBitGoError(error, secrets)}`);
    }
  });
});
