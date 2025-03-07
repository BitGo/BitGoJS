import assert from 'assert';

import * as bitcoinjslib from 'bitcoinjs-lib';
import { Descriptor } from '@bitgo/wasm-miniscript';
import { ECPairInterface } from '@bitgo/utxo-lib';
import { toWrappedPsbt } from '@bitgo/utxo-core/descriptor';

export function getSignedPsbt(
  psbt: bitcoinjslib.Psbt,
  descriptor: Descriptor,
  signers: ECPairInterface[],
  { finalize = false }
): bitcoinjslib.Psbt {
  const wrappedPsbt = toWrappedPsbt(psbt.toBuffer());
  const signedInputs = psbt.data.inputs.flatMap((input, i) => {
    assert(input.witnessUtxo);
    if (Buffer.from(descriptor.scriptPubkey()).equals(input.witnessUtxo.script)) {
      wrappedPsbt.updateInputWithDescriptor(i, descriptor);
      const signResults = signers.map((signer) => {
        assert(signer.privateKey);
        return wrappedPsbt.signWithPrv(signer.privateKey);
      });
      return [[i, signResults]];
    }
    return [];
  });
  assert(signedInputs.length > 0);
  if (finalize) {
    wrappedPsbt.finalize();
  }
  return bitcoinjslib.Psbt.fromBuffer(Buffer.from(wrappedPsbt.serialize()));
}

export function getSignedExtract(
  psbt: bitcoinjslib.Psbt,
  descriptor: Descriptor,
  signers: ECPairInterface[]
): bitcoinjslib.Transaction {
  return getSignedPsbt(psbt, descriptor, signers, { finalize: true }).extractTransaction();
}
