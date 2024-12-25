import assert from 'assert';

import _ from 'lodash';
import { Triple, VerificationOptions, Wallet } from '@bitgo/sdk-core';
import * as utxolib from '@bitgo/utxo-lib';

import {
  AbstractUtxoCoin,
  FixedScriptWalletOutput,
  Output,
  TransactionExplanation,
  ParsedTransaction,
  ParseTransactionOptions,
} from '../../abstractUtxoCoin';
import { fetchKeychains, getKeySignatures, toKeychainTriple, UtxoKeychain, UtxoNamedKeychains } from '../../keychains';

import { CustomChangeOptions, parseOutput } from './parseOutput';

/**
 * @param first
 * @param second
 * @returns {Array} All outputs that are in the first array but not in the second
 */
export function outputDifference(first: Output[], second: Output[]): Output[] {
  const keyFunc = ({ address, amount }: Output): string => `${address}:${amount}`;
  const groupedOutputs = _.groupBy(first, keyFunc);

  second.forEach((output) => {
    const group = groupedOutputs[keyFunc(output)];
    if (group) {
      group.pop();
    }
  });

  return _.flatten(_.values(groupedOutputs));
}

export async function parseTransaction<TNumber extends bigint | number>(
  coin: AbstractUtxoCoin,
  params: ParseTransactionOptions<TNumber>
): Promise<ParsedTransaction<TNumber>> {
  const { txParams, txPrebuild, wallet, verification = {}, reqId } = params;

  if (!_.isUndefined(verification.disableNetworking) && !_.isBoolean(verification.disableNetworking)) {
    throw new Error('verification.disableNetworking must be a boolean');
  }
  const disableNetworking = verification.disableNetworking;

  // obtain the keychains and key signatures
  let keychains: UtxoNamedKeychains | VerificationOptions['keychains'] | undefined = verification.keychains;
  if (!keychains) {
    if (disableNetworking) {
      throw new Error('cannot fetch keychains without networking');
    }
    keychains = await fetchKeychains(coin, wallet, reqId);
  }

  if (!UtxoNamedKeychains.is(keychains)) {
    throw new Error('invalid keychains');
  }

  const keychainArray: Triple<UtxoKeychain> = toKeychainTriple(keychains);

  if (_.isUndefined(txPrebuild.txHex)) {
    throw new Error('missing required txPrebuild property txHex');
  }

  // obtain all outputs
  const explanation: TransactionExplanation = await coin.explainTransaction<TNumber>({
    txHex: txPrebuild.txHex,
    txInfo: txPrebuild.txInfo,
    pubs: keychainArray.map((k) => k.pub) as Triple<string>,
  });

  const allOutputs = [...explanation.outputs, ...explanation.changeOutputs];

  /** Get the amount on the transaction. This amount is being derived explicitly from the txHex
   * and not by any API metadata, so this is safe to do */
  function getExplanationAmountForAddress(address: string): number | string {
    const recipient = explanation.outputs.find((output) => output.address === address);
    if (!recipient) {
      throw new Error(`Recipient not found for address: ${address}`);
    }
    return recipient.amount;
  }

  let expectedOutputs;
  if (txParams.rbfTxIds) {
    assert(txParams.rbfTxIds.length === 1);

    const txToBeReplaced = await wallet.getTransaction({ txHash: txParams.rbfTxIds[0], includeRbf: true });
    expectedOutputs = txToBeReplaced.outputs.flatMap(
      (output: { valueString: string; address?: string; wallet?: string }) => {
        // For self-sends, the walletId will be the same as the wallet's id
        if (output.wallet === wallet.id()) {
          return [];
        }
        return [coin.toCanonicalTransactionRecipient(output)];
      }
    );
  } else {
    // verify that each recipient from txParams has their own output
    expectedOutputs = (txParams.recipients ?? []).flatMap((output) => {
      if (output.address === undefined) {
        if (output.amount.toString() !== '0') {
          throw new Error(`Only zero amounts allowed for non-encodeable scriptPubkeys: ${output}`);
        }
        return [output];
      }
      const address = coin.canonicalAddress(output.address);
      return [
        {
          ...output,
          address,
          // If one of the recipients has the amount max, we need to set it to an actual amount
          amount: output.amount === 'max' ? getExplanationAmountForAddress(address) : output.amount,
        },
      ];
    });
    if (txParams.allowExternalChangeAddress && txParams.changeAddress) {
      // when an external change address is explicitly specified, count all outputs going towards that
      // address in the expected outputs (regardless of the output amount)
      expectedOutputs.push(
        ...allOutputs.flatMap((output) => {
          if (
            output.address === undefined ||
            output.address !== coin.canonicalAddress(txParams.changeAddress as string)
          ) {
            return [];
          }
          return [{ ...output, address: coin.canonicalAddress(output.address) }];
        })
      );
    }
  }

  const missingOutputs = outputDifference(expectedOutputs, allOutputs);

  // get the keychains from the custom change wallet if needed
  let customChange: CustomChangeOptions | undefined;
  const { customChangeWalletId = undefined } = wallet.coinSpecific() || {};
  if (customChangeWalletId) {
    // fetch keychains from custom change wallet for deriving addresses.
    // These keychains should be signed and this should be verified in verifyTransaction
    const customChangeKeySignatures = wallet._wallet.customChangeKeySignatures;
    const customChangeWallet: Wallet = await coin.wallets().get({ id: customChangeWalletId });
    const customChangeKeys = await fetchKeychains(coin, customChangeWallet, reqId);

    if (!customChangeKeys) {
      throw new Error('failed to fetch keychains for custom change wallet');
    }

    if (customChangeKeys.user && customChangeKeys.backup && customChangeKeys.bitgo && customChangeWallet) {
      const customChangeKeychains: Triple<UtxoKeychain> = [
        customChangeKeys.user,
        customChangeKeys.backup,
        customChangeKeys.bitgo,
      ];

      customChange = {
        keys: customChangeKeychains,
        signatures: [customChangeKeySignatures.user, customChangeKeySignatures.backup, customChangeKeySignatures.bitgo],
      };
    }
  }

  /**
   * Loop through all the outputs and classify each of them as either internal spends
   * or external spends by setting the "external" property to true or false on the output object.
   */
  const allOutputDetails: Output[] = await Promise.all(
    allOutputs.map((currentOutput) => {
      return parseOutput({
        currentOutput,
        coin,
        txPrebuild,
        verification,
        keychainArray: toKeychainTriple(keychains),
        wallet,
        txParams: {
          recipients: expectedOutputs,
          changeAddress: txParams.changeAddress,
        },
        customChange,
        reqId,
      });
    })
  );

  const needsCustomChangeKeySignatureVerification = allOutputDetails.some(
    (output) => (output as FixedScriptWalletOutput)?.needsCustomChangeKeySignatureVerification
  );

  const changeOutputs = _.filter(allOutputDetails, { external: false });

  // these are all the outputs that were not originally explicitly specified in recipients
  // ideally change outputs or a paygo output that might have been added
  const implicitOutputs = outputDifference(allOutputDetails, expectedOutputs);

  const explicitOutputs = outputDifference(allOutputDetails, implicitOutputs);

  // these are all the non-wallet outputs that had been originally explicitly specified in recipients
  const explicitExternalOutputs = _.filter(explicitOutputs, { external: true });

  // this is the sum of all the originally explicitly specified non-wallet output values
  const explicitExternalSpendAmount = utxolib.bitgo.toTNumber<TNumber>(
    explicitExternalOutputs.reduce((sum: bigint, o: Output) => sum + BigInt(o.amount), BigInt(0)) as bigint,
    coin.amountType
  );

  /**
   * The calculation of the implicit external spend amount pertains to verifying the pay-as-you-go-fee BitGo
   * automatically applies to transactions sending money out of the wallet. The logic is fairly straightforward
   * in that we compare the external spend amount that was specified explicitly by the user to the portion
   * that was specified implicitly. To protect customers from people tampering with the transaction outputs, we
   * define a threshold for the maximum percentage of the implicit external spend in relation to the explicit
   * external spend.
   */

  // make sure that all the extra addresses are change addresses
  // get all the additional external outputs the server added and calculate their values
  const implicitExternalOutputs = _.filter(implicitOutputs, { external: true });
  const implicitExternalSpendAmount = utxolib.bitgo.toTNumber<TNumber>(
    implicitExternalOutputs.reduce((sum: bigint, o: Output) => sum + BigInt(o.amount), BigInt(0)) as bigint,
    coin.amountType
  );

  return {
    keychains,
    keySignatures: getKeySignatures(wallet) ?? {},
    outputs: allOutputDetails,
    missingOutputs,
    explicitExternalOutputs,
    implicitExternalOutputs,
    changeOutputs,
    explicitExternalSpendAmount,
    implicitExternalSpendAmount,
    needsCustomChangeKeySignatureVerification,
    customChange,
  };
}
