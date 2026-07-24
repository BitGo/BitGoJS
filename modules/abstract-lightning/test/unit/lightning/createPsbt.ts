import * as utxolib from '@bitgo/utxo-lib';

export interface PsbtCreationOptions {
  network: utxolib.Network;
  inputValue?: number;
  outputValue?: number;
  outputAddress?: string;
  changeValue?: number;
  changeDerivationPath?: string;
  changePurpose?: 49 | 84 | 86;
  includeChangeOutput?: boolean;
  masterKey?: utxolib.BIP32Interface; // Optional master key for deriving addresses
}

export interface PsbtCreationResult {
  psbt: utxolib.Psbt;
  masterKey: utxolib.BIP32Interface;
  changeDerivationPath: string;
  changePurpose: number;
}

/**
 * Creates a PSBT for testing purposes with customizable options.
 * This helper function generates a PSBT with a fake input and configurable outputs.
 *
 * @param options - Configuration options for PSBT creation
 * @returns A constructed PSBT instance and the master key used
 */
export function createTestPsbt(options: PsbtCreationOptions): PsbtCreationResult {
  const {
    network,
    inputValue = 500000,
    outputValue = 100000,
    outputAddress,
    changeValue,
    changeDerivationPath = "m/84'/0'/0'/1/6",
    changePurpose = 84,
    includeChangeOutput = true,
    masterKey,
  } = options;
  const fixedSeed = Buffer.from('0101010101010101010101010101010101010101010101010101010101010101', 'hex');
  const accountMasterKey = masterKey || utxolib.bip32.fromSeed(fixedSeed, network);

  const inputPrivateKey = Buffer.from('0202020202020202020202020202020202020202020202020202020202020202', 'hex');
  const inputKeyPair = utxolib.ECPair.fromPrivateKey(inputPrivateKey, { network });
  const p2wpkhInput = utxolib.payments.p2wpkh({
    pubkey: Buffer.from(inputKeyPair.publicKey),
    network,
  });

  // Create a new PSBT instance
  const psbt = new utxolib.Psbt({ network });

  // Add a fake input to the PSBT
  const fakeTxId = 'ca6852598b48230ac870814b935b0d982d3968eb00a1d97332dceb6cd9b8505e';
  const fakeVout = 1;

  psbt.addInput({
    hash: fakeTxId,
    index: fakeVout,
    witnessUtxo: {
      script: p2wpkhInput.output!,
      value: BigInt(inputValue),
    },
    bip32Derivation: [
      {
        masterFingerprint: Buffer.alloc(4, 0),
        path: "m/84'/0'/0'/0/0",
        pubkey: Buffer.from(inputKeyPair.publicKey),
      },
    ],
  });

  // Add recipient output
  let recipientAddress: string;
  if (outputAddress) {
    recipientAddress = outputAddress;
  } else {
    const recipientPrivateKey = Buffer.from('0303030303030303030303030303030303030303030303030303030303030303', 'hex');
    const recipientKeyPair = utxolib.ECPair.fromPrivateKey(recipientPrivateKey, { network });
    // P2TR requires x-only pubkey (32 bytes, without the prefix byte)
    const xOnlyPubkey =
      recipientKeyPair.publicKey.length === 33
        ? recipientKeyPair.publicKey.subarray(1, 33)
        : recipientKeyPair.publicKey;
    const recipientP2tr = utxolib.payments.p2tr(
      {
        pubkey: xOnlyPubkey,
        network,
      },
      { eccLib: utxolib.ecc }
    );
    recipientAddress = recipientP2tr.address!;
  }

  psbt.addOutput({
    address: recipientAddress,
    value: BigInt(outputValue),
  });

  // Add change output if requested
  if (includeChangeOutput) {
    const calculatedChangeValue = changeValue !== undefined ? changeValue : inputValue - outputValue - 10000; // 10k sats fee

    // Parse the derivation path to get the change and address indices
    // Expected format: m/purpose'/coin_type'/account'/change/address_index
    const pathSegments = changeDerivationPath.split('/');
    const changeIndex = Number(pathSegments[pathSegments.length - 2]);
    const addressIndex = Number(pathSegments[pathSegments.length - 1]);

    // Derive the change key from the master key
    const changeNode = accountMasterKey.derive(changeIndex).derive(addressIndex);
    const changePubkey = changeNode.publicKey;

    let changeAddress: string;
    let changePayment;

    // Create change address based on purpose
    switch (changePurpose) {
      case 49: // P2SH-P2WPKH
        changePayment = utxolib.payments.p2sh({
          redeem: utxolib.payments.p2wpkh({
            pubkey: changePubkey,
            network,
          }),
          network,
        });
        changeAddress = changePayment.address!;
        break;
      case 84: // P2WPKH
        changePayment = utxolib.payments.p2wpkh({
          pubkey: changePubkey,
          network,
        });
        changeAddress = changePayment.address!;
        break;
      case 86: // P2TR
        const xOnlyChangePubkey = changePubkey.length === 33 ? changePubkey.subarray(1, 33) : changePubkey;
        changePayment = utxolib.payments.p2tr(
          {
            pubkey: xOnlyChangePubkey,
            network,
          },
          { eccLib: utxolib.ecc }
        );
        changeAddress = changePayment.address!;
        break;
      default:
        throw new Error(`Unsupported purpose: ${changePurpose}`);
    }

    psbt.addOutput({
      address: changeAddress,
      value: BigInt(calculatedChangeValue),
    });

    // Add bip32Derivation to the change output
    psbt.updateOutput(1, {
      bip32Derivation: [
        {
          masterFingerprint: Buffer.alloc(4, 0),
          path: changeDerivationPath,
          pubkey: changePubkey,
        },
      ],
    });
  }

  return {
    psbt,
    masterKey: accountMasterKey,
    changeDerivationPath,
    changePurpose,
  };
}
