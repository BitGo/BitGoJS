import assert from 'assert';

import _ from 'lodash';
import { ITransactionRecipient, KeyIndices, Triple, VerificationOptions, Wallet } from '@bitgo/sdk-core';

import type { AbstractUtxoCoin, ParseTransactionOptions } from '../../abstractUtxoCoin';
import type { FixedScriptWalletOutput, Output, ParsedTransaction } from '../types';
import {
  fetchKeychains,
  getKeySignatures,
  toKeychainTriple,
  toXpubTriple,
  UtxoKeychain,
  UtxoNamedKeychains,
} from '../../keychains';
import { verifyKeySignature } from '../../verifyKey';
import {
  assertValidTransactionRecipient,
  fromExtendedAddressFormatToScript,
  isScriptRecipient,
  toExtendedAddressFormat,
  toOutputScript,
} from '../recipient';
import { ComparableOutput, ExpectedOutput, outputDifference } from '../outputDifference';
import { toTNumber } from '../../tnumber';

import type { TransactionExplanation } from './explainTransaction';
import { CustomChangeOptions, parseOutput } from './parseOutput';

export type ComparableOutputWithExternal<TValue> = (ComparableOutput<TValue> | ExpectedOutput) & {
  external: boolean | undefined;
};

function toCanonicalTransactionRecipient(
  coin: AbstractUtxoCoin,
  output: { valueString: string; address?: string }
): {
  amount: bigint;
  address: string;
} {
  const amount = BigInt(output.valueString);
  assertValidTransactionRecipient({ amount, address: output.address });
  assert(output.address, 'address is required');
  if (isScriptRecipient(output.address)) {
    return { amount, address: output.address };
  }
  return { amount, address: coin.canonicalAddress(output.address) };
}

async function parseRbfTransaction<TNumber extends bigint | number>(
  coin: AbstractUtxoCoin,
  params: ParseTransactionOptions<TNumber>
): Promise<ParsedTransaction<TNumber>> {
  const { txParams, wallet } = params;

  assert(txParams.rbfTxIds);
  assert(txParams.rbfTxIds.length === 1);

  const txToBeReplaced = await wallet.getTransaction({ txHash: txParams.rbfTxIds[0], includeRbf: true });
  const recipients = txToBeReplaced.outputs.flatMap(
    (output: { valueString: string; address?: string; wallet?: string }) => {
      // For self-sends, the walletId will be the same as the wallet's id
      if (output.wallet === wallet.id()) {
        return [];
      }
      return [toCanonicalTransactionRecipient(coin, output)];
    }
  );

  // Recurse into parseTransaction with the derived recipients and without rbfTxIds
  return parseTransaction(coin, {
    ...params,
    txParams: {
      ...txParams,
      recipients,
      rbfTxIds: undefined,
    },
  });
}

function toExpectedOutputs(
  coin: AbstractUtxoCoin,
  txParams: {
    recipients?: ITransactionRecipient[];
    allowExternalChangeAddress?: boolean;
    changeAddress?: string;
  }
): ExpectedOutput[] {
  // verify that each recipient from txParams has their own output
  const expectedOutputs: ExpectedOutput[] = (txParams.recipients ?? []).flatMap((output) => {
    if (output.address === undefined) {
      assert('script' in output, 'script is required for non-encodeable scriptPubkeys');
      if (output.amount.toString() !== '0') {
        throw new Error(`Only zero amounts allowed for non-encodeable scriptPubkeys: ${output}`);
      }
      return [
        {
          script: toOutputScript(output, coin.name),
          value: output.amount === 'max' ? 'max' : BigInt(output.amount),
        },
      ];
    }
    return [
      {
        script: fromExtendedAddressFormatToScript(output.address, coin.name),
        value: output.amount === 'max' ? 'max' : BigInt(output.amount),
      },
    ];
  });
  if (txParams.allowExternalChangeAddress && txParams.changeAddress) {
    expectedOutputs.push({
      script: toOutputScript(txParams.changeAddress, coin.name),
      // When an external change address is explicitly specified, count all outputs going towards that
      // address in the expected outputs (regardless of the output amount)
      value: 'max',
      // Note that the change output is not required to exist, so we mark it as optional.
      optional: true,
    });
  }
  return expectedOutputs;
}

function verifyCustomChangeKeys(userKeychain: UtxoKeychain, customChange: CustomChangeOptions): void {
  for (const keyIndex of [KeyIndices.USER, KeyIndices.BACKUP, KeyIndices.BITGO]) {
    if (
      !verifyKeySignature({
        userKeychain,
        keychainToVerify: customChange.keys[keyIndex],
        keySignature: customChange.signatures[keyIndex],
      })
    ) {
      throw new Error(`failed to verify custom change ${KeyIndices[keyIndex].toLowerCase()} key signature`);
    }
  }
}

export async function parseTransaction<TNumber extends bigint | number>(
  coin: AbstractUtxoCoin,
  params: ParseTransactionOptions<TNumber>
): Promise<ParsedTransaction<TNumber>> {
  const { txParams, txPrebuild, wallet, verification = {}, reqId } = params;

  // Branch off early for RBF transactions
  if (txParams.rbfTxIds) {
    return parseRbfTransaction(coin, params);
  }

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

  const expectedOutputs = toExpectedOutputs(coin, txParams);

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

  let customChangeXpubs: Triple<string> | undefined;
  if (customChange) {
    verifyCustomChangeKeys(keychainArray[KeyIndices.USER], customChange);
    customChangeXpubs = toXpubTriple(customChange.keys);
  }

  // obtain all outputs
  const explanation: TransactionExplanation = await coin.explainTransaction<TNumber>({
    txHex: txPrebuild.txHex,
    txInfo: txPrebuild.txInfo,
    decodeWith: txPrebuild.decodeWith,
    pubs: keychainArray.map((k) => k.pub) as Triple<string>,
    customChangeXpubs,
  });

  const allOutputs = [...explanation.outputs, ...explanation.changeOutputs];

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
          recipients: txParams.recipients ?? [],
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

  function toComparableOutputsWithExternal(outputs: Output[]): ComparableOutputWithExternal<bigint | 'max'>[] {
    return outputs.map((output) => ({
      script: fromExtendedAddressFormatToScript(output.address, coin.name),
      value: output.amount === 'max' ? 'max' : (BigInt(output.amount) as bigint | 'max'),
      external: output.external,
    }));
  }

  const missingOutputs = outputDifference(expectedOutputs, toComparableOutputsWithExternal(allOutputs));

  const implicitOutputs = outputDifference(toComparableOutputsWithExternal(allOutputDetails), expectedOutputs);
  const explicitOutputs = outputDifference(toComparableOutputsWithExternal(allOutputDetails), implicitOutputs);

  // these are all the non-wallet outputs that had been originally explicitly specified in recipients
  const explicitExternalOutputs = explicitOutputs.filter((output) => output.external);
  // this is the sum of all the originally explicitly specified non-wallet output values
  const explicitExternalSpendAmount = toTNumber(
    explicitExternalOutputs.reduce((sum: bigint, o) => sum + BigInt(o.value), BigInt(0)),
    coin.amountType
  ) as TNumber;

  /**
   * The calculation of the implicit external spend amount pertains to verifying the pay-as-you-go-fee BitGo
   * automatically applied to transactions sending money out of the wallet. The logic is fairly straightforward
   * in that we compare the external spend amount that was specified explicitly by the user to the portion
   * that was specified implicitly. To protect customers from people tampering with the transaction outputs, we
   * define a threshold for the maximum percentage of the implicit external spend in relation to the explicit
   * external spend.
   *
   * This has become obsolete with the intoduction of `utxocore.paygo.verifyPayGoAddressProof()`.
   */

  // make sure that all the extra addresses are change addresses
  // get all the additional external outputs the server added and calculate their values
  const implicitExternalOutputs = implicitOutputs.filter((output) => output.external);
  const implicitExternalSpendAmount = toTNumber(
    implicitExternalOutputs.reduce((sum: bigint, o) => sum + BigInt(o.value), BigInt(0)),
    coin.amountType
  ) as TNumber;

  function toOutputs(outputs: ExpectedOutput[] | ComparableOutputWithExternal<bigint | 'max'>[]): Output[] {
    return outputs.map((output) => ({
      address: toExtendedAddressFormat(output.script, coin.name),
      amount: output.value.toString(),
      external: output.external,
    }));
  }

  return {
    keychains,
    keySignatures: getKeySignatures(wallet) ?? {},
    outputs: allOutputDetails,
    missingOutputs: toOutputs(missingOutputs),
    explicitExternalOutputs: toOutputs(explicitExternalOutputs),
    implicitExternalOutputs: toOutputs(implicitExternalOutputs),
    changeOutputs,
    explicitExternalSpendAmount,
    implicitExternalSpendAmount,
    needsCustomChangeKeySignatureVerification,
    customChange,
  };
}
