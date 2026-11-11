import 'should';
import { coins } from '@bitgo/statics';
import { BitGoBase, IWallet, TransactionParams, TransactionPrebuild } from '@bitgo/sdk-core';
import { PublicKey, StakeProgram, Transaction as SolTransaction } from '@solana/web3.js';

import { Sol } from '../../src';
import * as testData from '../resources/sol';

/**
 * Verifies a staking withdraw prebuild against the declared recipients.
 *
 * These tests deliberately avoid `TestBitGo.decorate`, which requires the CI-only
 * BITGOJS_TEST_PASSWORD secret, so the recipient check stays covered in local runs.
 */
describe('SOL staking withdraw verification', () => {
  const walletRoot = testData.authAccount.pub;
  const stakeAccount = testData.stakeAccount.pub;
  const destination = testData.authAccount2.pub;
  const blockHash = testData.blockHashes.validBlockHashes[0];
  const amount = '10000';

  // `Sol`'s constructor only uses `url`, and verifyTransaction never touches the other collaborators.
  const basecoin = new Sol({ url: () => '' } as unknown as BitGoBase, coins.get('sol'));
  // verifyTransaction only reads the wallet's root address.
  const wallet = { coinSpecific: () => ({ rootAddress: walletRoot }) } as unknown as IWallet;

  const prebuildPayingTo = (toAddress: string): TransactionPrebuild => {
    const rawTx = new SolTransaction().add(
      ...StakeProgram.withdraw({
        stakePubkey: new PublicKey(stakeAccount),
        authorizedPubkey: new PublicKey(walletRoot),
        toPubkey: new PublicKey(toAddress),
        lamports: Number(amount),
      }).instructions
    );
    rawTx.feePayer = new PublicKey(walletRoot);
    rawTx.recentBlockhash = blockHash;
    return {
      txBase64: rawTx.serialize({ requireAllSignatures: false, verifySignatures: false }).toString('base64'),
      txInfo: { feePayer: walletRoot, nonce: blockHash },
    };
  };

  const verifyPayingTo = (toAddress: string, recipientAddress: string) => {
    const txParams: TransactionParams = { recipients: [{ address: recipientAddress, amount }] };
    return basecoin.verifyTransaction({
      txParams,
      txPrebuild: prebuildPayingTo(toAddress),
      wallet,
      feePayer: walletRoot,
      blockhash: blockHash,
    });
  };

  it('rejects a staking withdraw that pays a destination other than the declared recipient', async () => {
    await verifyPayingTo(destination, walletRoot).should.be.rejectedWith(
      'Tx outputs does not match with expected txParams recipients'
    );
  });

  it('accepts a staking withdraw that pays the declared recipient', async () => {
    const result = await verifyPayingTo(destination, destination);
    result.should.equal(true);
  });
});
