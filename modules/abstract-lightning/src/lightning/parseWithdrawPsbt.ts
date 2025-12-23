import * as utxolib from '@bitgo/utxo-lib';
import { isMainnet, Psbt } from '@bitgo/utxo-lib';
import { WatchOnlyAccount, WithdrawBaseOutputUTXO } from '../codecs';
import { LightningOnchainRecipient } from '@bitgo/public-types';
import { Bip32Derivation } from 'bip174/src/lib/interfaces';
import {
  ExtendedKeyAddressPurpose,
  PURPOSE_P2TR,
  PURPOSE_P2WKH,
  PURPOSE_WRAPPED_P2WKH,
  revertXpubPrefix,
} from './lightningUtils';

function parseDerivationPath(derivationPath: string): {
  purpose: ExtendedKeyAddressPurpose;
  change: number;
  addressIndex: number;
} {
  const pathSegments = derivationPath.split('/');
  const purpose = Number(pathSegments[1].replace(/'/g, ''));
  const change = Number(pathSegments[pathSegments.length - 2]);
  const addressIndex = Number(pathSegments[pathSegments.length - 1]);
  if (purpose !== PURPOSE_WRAPPED_P2WKH && purpose !== PURPOSE_P2WKH && purpose !== PURPOSE_P2TR) {
    throw new Error(`Unsupported purpose in derivation path: ${purpose}`);
  }
  return { purpose, change, addressIndex };
}

export function parsePsbtOutputs(psbt: Psbt, network: utxolib.Network): WithdrawBaseOutputUTXO<bigint>[] {
  const parsedOutputs: WithdrawBaseOutputUTXO<bigint>[] = [];
  let bip32Derivation: Bip32Derivation | undefined;

  for (let i = 0; i < psbt.data.outputs.length; i++) {
    const output = psbt.data.outputs[i];
    const txOutput = psbt.txOutputs[i];

    let address = '';
    const value = txOutput.value;
    let isChange = false;

    if (output.bip32Derivation && output.bip32Derivation.length > 0) {
      isChange = true;
      bip32Derivation = output.bip32Derivation[0];
    }
    if (txOutput.script) {
      address = utxolib.address.fromOutputScript(txOutput.script, network);
    }
    const valueBigInt = BigInt(value);

    parsedOutputs.push({
      address,
      value: valueBigInt,
      change: isChange,
      bip32Derivation,
    });
  }

  return parsedOutputs;
}

export function verifyChangeAddress(
  output: WithdrawBaseOutputUTXO<bigint>,
  accounts: WatchOnlyAccount[],
  network: utxolib.Network
): void {
  if (!output.bip32Derivation || !output.bip32Derivation.path) {
    throw new Error(`bip32Derivation path not found for change address`);
  }
  // derivation path example: m/84'/0'/0'/1/0
  const { purpose, change, addressIndex } = parseDerivationPath(output.bip32Derivation.path);

  // Find the corresponding account using the purpose
  const account = accounts.find((acc) => acc.purpose === purpose);
  if (!account) {
    throw new Error(`Account not found for purpose: ${purpose}`);
  }

  // convert upub, vpub, etc prefixes to xpub as utxolib doesn't support these
  const convertedXpub = revertXpubPrefix(account.xpub, purpose, isMainnet(network));
  // Create a BIP32 node from the xpub
  const xpubNode = utxolib.bip32.fromBase58(convertedXpub, network);

  // Derive the public key from the xpub using the change and address index
  const derivedPubkey = xpubNode.derive(change).derive(addressIndex).publicKey;

  if (derivedPubkey.toString('hex') !== output.bip32Derivation.pubkey.toString('hex')) {
    throw new Error(
      `Derived pubkey does not match for address: ${output.address}, derived: ${derivedPubkey.toString(
        'hex'
      )}, expected: ${output.bip32Derivation.pubkey.toString('hex')}`
    );
  }

  // Determine the correct payment type based on the purpose
  let derivedAddress: string | undefined;
  switch (purpose) {
    case 49: // P2SH-P2WPKH (Nested SegWit)
      derivedAddress = utxolib.payments.p2sh({
        redeem: utxolib.payments.p2wpkh({
          pubkey: derivedPubkey,
          network,
        }),
        network,
      }).address;
      break;
    case 84: // P2WPKH (Native SegWit)
      derivedAddress = utxolib.payments.p2wpkh({
        pubkey: derivedPubkey,
        network,
      }).address;
      break;
    case 86: // P2TR (Taproot)
      // P2TR requires x-only pubkey (32 bytes)
      const xOnlyPubkey = derivedPubkey.length === 33 ? derivedPubkey.subarray(1, 33) : derivedPubkey;
      derivedAddress = utxolib.payments.p2tr(
        {
          pubkey: xOnlyPubkey,
          network,
        },
        { eccLib: utxolib.ecc }
      ).address;
      break;
    default:
      throw new Error(`Unsupported purpose: ${purpose}`);
  }

  if (derivedAddress !== output.address) {
    throw new Error(`invalid change address: expected ${derivedAddress}, got ${output.address}`);
  }
}

/**
 * Validates the funded psbt before creating the signatures for withdraw.
 */
export function validatePsbtForWithdraw(
  psbtHex: string,
  network: utxolib.Network,
  recipients: LightningOnchainRecipient[],
  accounts: WatchOnlyAccount[]
): void {
  const parsedPsbt = Psbt.fromHex(psbtHex, { network: network });
  const outputs = parsePsbtOutputs(parsedPsbt, network);
  outputs.forEach((output) => {
    if (output.change) {
      try {
        verifyChangeAddress(output, accounts, network);
      } catch (e: any) {
        throw new Error(`Unable to verify change address: ${e}`);
      }
    } else {
      let match = false;
      recipients.forEach((recipient) => {
        if (recipient.address === output.address && BigInt(recipient.amountSat) === output.value) {
          match = true;
        }
      });
      if (!match) {
        throw new Error(`PSBT output ${output.address} with value ${output.value} does not match any recipient`);
      }
    }
  });
}
