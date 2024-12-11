import buildDebug from 'debug';
import _ from 'lodash';
import BigNumber from 'bignumber.js';
import { BitGoBase } from '@bitgo/sdk-core';
import * as utxolib from '@bitgo/utxo-lib';

import { AbstractUtxoCoin, Output, ParsedTransaction, VerifyTransactionOptions } from '../../abstractUtxoCoin';
import { verifyCustomChangeKeySignatures, verifyKeySignature, verifyUserPublicKey } from '../../verifyKey';
import { getPsbtTxInputs, getTxInputs } from '../fetchInputs';

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

export async function verifyTransaction<TNumber extends bigint | number>(
  coin: AbstractUtxoCoin,
  bitgo: BitGoBase,
  params: VerifyTransactionOptions<TNumber>
): Promise<boolean> {
  const { txParams, txPrebuild, wallet, verification = {}, reqId } = params;

  if (!_.isUndefined(verification.disableNetworking) && !_.isBoolean(verification.disableNetworking)) {
    throw new Error('verification.disableNetworking must be a boolean');
  }
  const isPsbt = txPrebuild.txHex && utxolib.bitgo.isPsbt(txPrebuild.txHex);
  if (isPsbt && txPrebuild.txInfo?.unspents) {
    throw new Error('should not have unspents in txInfo for psbt');
  }
  const disableNetworking = !!verification.disableNetworking;
  const parsedTransaction: ParsedTransaction<TNumber> = await coin.parseTransaction<TNumber>({
    txParams,
    txPrebuild,
    wallet,
    verification,
    reqId,
  });

  const keychains = parsedTransaction.keychains;

  // verify that the claimed user public key corresponds to the wallet's user private key
  let userPublicKeyVerified = false;
  try {
    // verify the user public key matches the private key - this will throw if there is no match
    userPublicKeyVerified = verifyUserPublicKey(bitgo, { userKeychain: keychains.user, disableNetworking, txParams });
  } catch (e) {
    debug('failed to verify user public key!', e);
  }

  // let's verify these keychains
  const keySignatures = parsedTransaction.keySignatures;
  if (!_.isEmpty(keySignatures)) {
    const verify = (key, pub) => {
      if (!keychains.user || !keychains.user.pub) {
        throw new Error('missing user keychain');
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
      throw new Error('secondary public key signatures invalid');
    }
    debug('successfully verified backup and bitgo key signatures');
  } else if (!disableNetworking) {
    // these keys were obtained online and their signatures were not verified
    // this could be dangerous
    console.log('unsigned keys obtained online are being used for address verification');
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

  const missingOutputs = parsedTransaction.missingOutputs;
  if (missingOutputs.length !== 0) {
    // there are some outputs in the recipients list that have not made it into the actual transaction
    throw new Error('expected outputs missing in transaction prebuild');
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
    if (isPsbt && parsedTransaction.customChange) {
      // In the case that we have a custom change address on a wallet and we are building the transaction
      // with a PSBT, we do not have the metadata to verify the address from the custom change wallet, nor
      // can we fetch that information from the other wallet because we may not have the credentials. Therefore,
      // we will not throw an error here, but we will log a warning.
      debug(`cannot verify some of the addresses because it belongs to a separate wallet`);
    } else {
      // the additional external outputs can only be BitGo's pay-as-you-go fee, but we cannot verify the wallet address
      // there are some addresses that are outside the scope of intended recipients that are not change addresses
      throw new Error('prebuild attempts to spend to unintended external recipients');
    }
  }

  const allOutputs = parsedTransaction.outputs;
  if (!txPrebuild.txHex) {
    throw new Error(`txPrebuild.txHex not set`);
  }
  const inputs = isPsbt
    ? getPsbtTxInputs(txPrebuild.txHex, coin.network).map((v) => ({
        ...v,
        value: utxolib.bitgo.toTNumber(v.value, coin.amountType),
      }))
    : await getTxInputs({ txPrebuild, bitgo, coin, disableNetworking, reqId });
  // coins (doge) that can exceed number limits (and thus will use bigint) will have the `valueString` field
  const inputAmount = inputs.reduce(
    (sum: bigint, i) => sum + BigInt(coin.amountType === 'bigint' ? i.valueString : i.value),
    BigInt(0)
  );
  const outputAmount = allOutputs.reduce((sum: bigint, o: Output) => sum + BigInt(o.amount), BigInt(0));
  const fee = inputAmount - outputAmount;

  if (fee < 0) {
    throw new Error(
      `attempting to spend ${outputAmount} satoshis, which exceeds the input amount (${inputAmount} satoshis) by ${-fee}`
    );
  }

  return true;
}
