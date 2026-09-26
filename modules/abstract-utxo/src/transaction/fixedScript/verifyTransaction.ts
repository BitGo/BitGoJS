import buildDebug from 'debug';
import _ from 'lodash';
import BigNumber from 'bignumber.js';
import { BitGoBase, TxIntentMismatchError, IBaseCoin } from '@bitgo/sdk-core';
import { hasPsbtMagic } from '@bitgo/wasm-utxo';

import { AbstractUtxoCoin, VerifyTransactionOptions } from '../../abstractUtxoCoin';
import { ParsedTransaction } from '../types';
import { stringToBufferTryFormats } from '../decode';
import { verifyCustomChangeKeySignatures, verifyKeySignature, verifyUserPublicKey } from '../../verifyKey';

const debug = buildDebug('bitgo:abstract-utxo:verifyTransaction');

/**
 * Get the maximum percentage limit for pay-as-you-go outputs
 *
 * @protected
 */
function getPayGoLimit(allowPaygoOutput?: boolean): number {
  // allowing paygo outputs needs to be the default behavior, so only disallow paygo outputs if the
  // relevant verification option is both set and false
  if (!_.isNil(allowPaygoOutput) && !allowPaygoOutput) {
    return 0;
  }
  // 150 basis points is the absolute permitted maximum if paygo outputs are allowed
  return 0.015;
}

/**
 * Verify that a transaction prebuild complies with the original intention for fixed-script wallets
 *
 * This implementation handles transaction verification for traditional UTXO coins using fixed scripts
 * (non-descriptor wallets). It validates keychains, signatures, outputs, and amounts.
 *
 * @param coin - The UTXO coin instance
 * @param bitgo - BitGo API instance for network calls
 * @param params - Verification parameters
 * @param params.txParams - Transaction parameters passed to send
 * @param params.txPrebuild - Prebuild object returned by server
 * @param params.wallet - Wallet object to obtain keys to verify against
 * @param params.verification - Verification options (disableNetworking, keychains, addresses)
 * @param params.reqId - Optional request ID for logging
 * @returns {boolean} True if verification passes
 * @throws {TxIntentMismatchError} if transaction validation fails
 */
export async function verifyTransaction<TNumber extends bigint | number>(
  coin: AbstractUtxoCoin,
  bitgo: BitGoBase,
  params: VerifyTransactionOptions<TNumber>
): Promise<boolean> {
  const { txParams, txPrebuild, wallet, verification = {}, reqId } = params;

  const txExplanation = await TxIntentMismatchError.tryGetTxExplanation(coin as unknown as IBaseCoin, txPrebuild);

  // Helper to throw TxIntentMismatchError with consistent context
  const throwTxMismatch = (message: string): never => {
    throw new TxIntentMismatchError(message, reqId, [txParams], txPrebuild.txHex, txExplanation);
  };

  if (!_.isUndefined(verification.disableNetworking) && !_.isBoolean(verification.disableNetworking)) {
    throw new TypeError('verification.disableNetworking must be a boolean');
  }
  if (!_.isUndefined(verification.allowUnsignedKeys) && !_.isBoolean(verification.allowUnsignedKeys)) {
    throw new TypeError('verification.allowUnsignedKeys must be a boolean');
  }
  const isPsbt = txPrebuild.txHex && hasPsbtMagic(stringToBufferTryFormats(txPrebuild.txHex, ['hex', 'base64']));
  if (isPsbt && txPrebuild.txInfo?.unspents) {
    throw new Error('should not have unspents in txInfo for psbt');
  }
  const disableNetworking = !!verification.disableNetworking;
  const allowUnsignedKeys = verification.allowUnsignedKeys === true;
  // keychains pinned by the caller are their own trust anchor and don't need to be re-anchored
  // to the wallet's user key (WCN-2114)
  const callerSuppliedKeychains = !_.isUndefined(verification.keychains);
  const isBridging = txParams.type === 'bridging';
  const parsedTransaction: ParsedTransaction<TNumber> = await coin.parseTransaction<TNumber>({
    txParams,
    txPrebuild,
    wallet,
    verification,
    reqId,
  });

  const keychains = parsedTransaction.keychains;

  // verify that the claimed user public key corresponds to the wallet's user private key.
  // this anchors the server-supplied user xpub to a client-held secret (WCN-2114) — without it,
  // the fetched xpub triple is only ever checked against itself.
  let userPublicKeyVerified = false;
  if (allowUnsignedKeys) {
    debug('skipping user public key verification: verification.allowUnsignedKeys is set');
  } else if (callerSuppliedKeychains && !parsedTransaction.needsCustomChangeKeySignatureVerification) {
    // caller-pinned keychains are their own trust anchor; custom-change outputs still require
    // the anchor below because the custom-change key set is always fetched from the platform
    debug('skipping user public key verification: keychains were supplied by the caller');
  } else {
    try {
      // verify the user public key matches the private key - this will throw if there is no match
      userPublicKeyVerified = await verifyUserPublicKey(bitgo, {
        userKeychain: keychains.user,
        disableNetworking,
        txParams,
      });
    } catch (e) {
      debug('failed to verify user public key!', e);
    }
    if (!userPublicKeyVerified && !parsedTransaction.needsCustomChangeKeySignatureVerification) {
      // custom-change transactions surface this failure via the dedicated check below
      throwTxMismatch('failed to verify user public key against the wallet user key');
    }
  }

  // verify the user-key signatures over the backup and bitgo keys, anchoring the fetched xpub triple
  const keySignatures = parsedTransaction.keySignatures;
  if (allowUnsignedKeys) {
    debug('skipping key signature verification: verification.allowUnsignedKeys is set');
  } else if (!_.isEmpty(keySignatures)) {
    const verify = (key, pub) => {
      if (!keychains.user || !keychains.user.pub) {
        throwTxMismatch('missing user keychain');
      }
      return verifyKeySignature({
        userKeychain: keychains.user as { pub: string },
        keychainToVerify: key,
        keySignature: pub,
      });
    };
    const isBackupKeySignatureValid = verify(keychains.backup, keySignatures.backupPub);
    const isBitgoKeySignatureValid = verify(keychains.bitgo, keySignatures.bitgoPub);
    if (!isBackupKeySignatureValid || !isBitgoKeySignatureValid) {
      throwTxMismatch('secondary public key signatures invalid');
    }
    debug('successfully verified backup and bitgo key signatures');
  } else if (callerSuppliedKeychains) {
    debug('wallet keySignatures missing; keychains were supplied by the caller');
  } else {
    // these keys were obtained online and cannot be tied back to the wallet's user key,
    // so the platform could have substituted any of them (WCN-2114)
    throwTxMismatch('wallet keySignatures missing; cannot verify server-supplied keychains');
  }

  if (parsedTransaction.needsCustomChangeKeySignatureVerification) {
    if (!keychains.user || !userPublicKeyVerified) {
      throw new Error('transaction requires verification of user public key, but it was unable to be verified');
    }
    const customChangeKeySignaturesVerified = verifyCustomChangeKeySignatures(parsedTransaction, keychains.user);
    if (!customChangeKeySignaturesVerified) {
      throw new Error(
        'transaction requires verification of custom change key signatures, but they were unable to be verified'
      );
    }
    debug('successfully verified user public key and custom change key signatures');
  }

  if (txParams.qr) {
    const allExternalOutputs = [
      ...parsedTransaction.explicitExternalOutputs,
      ...parsedTransaction.implicitExternalOutputs,
    ];
    if (allExternalOutputs.length > 0) {
      throwTxMismatch('quantum-resistant sweep transactions must only contain wallet-internal outputs');
    }
    return true;
  }

  const missingOutputs = parsedTransaction.missingOutputs;
  if (missingOutputs.length !== 0) {
    // there are some outputs in the recipients list that have not made it into the actual transaction
    throwTxMismatch('expected outputs missing in transaction prebuild');
  }

  const intendedExternalSpend = parsedTransaction.explicitExternalSpendAmount;

  // this is a limit we impose for the total value that is amended to the transaction beyond what was originally intended
  const payAsYouGoLimit = new BigNumber(getPayGoLimit(verification.allowPaygoOutput)).multipliedBy(
    intendedExternalSpend.toString()
  );

  /*
  Some explanation for why we're doing what we're doing:
  Some customers will have an output to BitGo's PAYGo wallet added to their transaction, and we need to account for
  it here. To protect someone tampering with the output to make it send more than it should to BitGo, we define a
  threshold for the output's value above which we'll throw an error, because the paygo output should never be that
  high.
   */

  // make sure that all the extra addresses are change addresses
  // get all the additional external outputs the server added and calculate their values
  const nonChangeAmount = new BigNumber(parsedTransaction.implicitExternalSpendAmount.toString());

  debug(
    'Intended spend is %s, Non-change amount is %s, paygo limit is %s',
    intendedExternalSpend.toString(),
    nonChangeAmount.toString(),
    payAsYouGoLimit.toString()
  );

  // There are two instances where we will get into this point here
  if (nonChangeAmount.gt(payAsYouGoLimit)) {
    if (isBridging) {
      // The implicit external output is the bridge deposit address (see note above); it has no
      // recipient to match against, so instead verify the total implicit external spend equals the
      // intended bridge amount from bridgingParams.
      const bridgeAmount = txParams.bridgingParams?.sbtc?.amount;
      if (bridgeAmount === undefined) {
        throwTxMismatch('bridging transaction is missing bridgingParams.sbtc.amount');
      } else if (!nonChangeAmount.eq(bridgeAmount.toString())) {
        throwTxMismatch(
          `bridging output amount (${nonChangeAmount.toString()}) does not match intended bridge amount (${bridgeAmount})`
        );
      } else {
        debug('verified bridging output amount matches bridgingParams.sbtc.amount');
      }
    } else if (isPsbt && parsedTransaction.customChange) {
      // In the case that we have a custom change address on a wallet and we are building the transaction
      // with a PSBT, we do not have the metadata to verify the address from the custom change wallet, nor
      // can we fetch that information from the other wallet because we may not have the credentials. Therefore,
      // we will not throw an error here, but we will log a warning.
      debug(`cannot verify some of the addresses because it belongs to a separate wallet`);
    } else {
      // the additional external outputs can only be BitGo's pay-as-you-go fee, but we cannot verify the wallet address
      // there are some addresses that are outside the scope of intended recipients that are not change addresses
      throwTxMismatch('prebuild attempts to spend to unintended external recipients');
    }
  }

  if (!txPrebuild.txHex) {
    throw new Error(`txPrebuild.txHex not set`);
  }

  return true;
}
