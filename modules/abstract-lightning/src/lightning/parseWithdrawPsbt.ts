import * as utxolib from '@bitgo/utxo-lib';
import { Psbt } from '@bitgo/utxo-lib';
import { WatchOnlyAccount, WithdrawBaseOutputUTXO } from '../codecs';
import { LightningOnchainRecipient } from '@bitgo/public-types';
import { Bip32Derivation } from 'bip174/src/lib/interfaces';

const paymentTypes = ['p2wpkh', 'p2sh', 'p2tr', 'p2pkh', 'p2wsh'];

function parsePaymentAddress(script: Buffer, network: utxolib.Network) {
  for (const type of paymentTypes) {
    try {
      let address: string | undefined;
      switch (type) {
        case 'p2pkh':
          address = utxolib.payments.p2pkh({ output: script, network }).address;
          break;
        case 'p2wpkh':
          address = utxolib.payments.p2wpkh({ output: script, network }).address;
          break;
        case 'p2wsh':
          address = utxolib.payments.p2wsh({ output: script, network }).address;
          break;
        case 'p2sh':
          address = utxolib.payments.p2sh({ output: script, network }).address;
          break;
        case 'p2tr':
          address = utxolib.payments.p2tr({ output: script, network }).address;
          break;
        default:
          continue;
      }
      if (address) {
        return address;
      }
    } catch (e) {
      // Do nothing, just try the next type
    }
  }
  return '';
}

function parsePsbtOutputs(psbt: Psbt, network: utxolib.Network): WithdrawBaseOutputUTXO<bigint>[] {
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
      address = parsePaymentAddress(txOutput.script, network);
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

function verifyChangeAddress(
  output: WithdrawBaseOutputUTXO<bigint>,
  accounts: WatchOnlyAccount[],
  network: utxolib.Network
): void {
  if (!output.bip32Derivation || !output.bip32Derivation.path) {
    throw new Error(`bip32Derivation path not found for change address`);
  }
  const derivationPath = output.bip32Derivation.path;

  // Extract the purpose from the derivation path (e.g., m/84' -> 84)
  const pathSegments = derivationPath.split('/');
  const purpose = Number(pathSegments[1].replace("'", ''));

  // Find the corresponding account using the purpose
  const account = accounts.find((acc) => acc.purpose === purpose);
  if (!account) {
    throw new Error(`Account not found for purpose: ${purpose}`);
  }

  // Create a BIP32 node from the xpub
  const xpubNode = utxolib.bip32.fromBase58(account.xpub, network);

  // Extract the change and address_index from the path (e.g., m/84'/0'/0'/1/0 -> 1 and 0)
  const change = Number(pathSegments[pathSegments.length - 2]);
  const addressIndex = Number(pathSegments[pathSegments.length - 1]);

  // Derive the public key from the xpub using the change and address index
  const derivedPubkey = xpubNode.derive(change).derive(addressIndex).publicKey;

  if (derivedPubkey.toString('hex') !== output.bip32Derivation.pubkey.toString('hex')) {
    throw new Error(`Derived pubkey does not match for address: ${output.address}`);
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
      derivedAddress = utxolib.payments.p2tr({
        pubkey: derivedPubkey,
        network,
      }).address;
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
        throw new Error(`Unable to verify change address: ${e.message}`);
      }
    } else {
      const match = recipients.find((r) => r.address === output.address && BigInt(r.amountSat) === output.value);
      if (!match) {
        throw new Error(`PSBT output ${output.address} with value ${output.value} does not match any recipient`);
      }
    }
  });
}
