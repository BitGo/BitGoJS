/*
This is a reference implementation for calculating weights and vSizes from bitcoinjs-lib 3.3.2.
https://github.com/bitcoinjs/bitcoinjs-lib/blob/v3.3.2/src/transaction.js#L194-L219

```
  function encodingLength (number) {
    checkUInt53(number)

    return (
      number < 0xfd ? 1
    : number <= 0xffff ? 3
    : number <= 0xffffffff ? 5
    : 9
    )
  }

  function varSliceSize (someScript) {
    var length = someScript.length

    return encodingLength(length) + length
  }

  function vectorSize (someVector) {
    var length = someVector.length

    return varuint.encodingLength(length) + someVector.reduce(function (sum, witness) {
      return sum + varSliceSize(witness)
    }, 0)
  }

  Transaction.prototype.__byteLength = function (__allowWitness) {
    var hasWitnesses = __allowWitness && this.hasWitnesses()

    return (
      (hasWitnesses ? 10 : 8) +
      varuint.encodingLength(this.ins.length) +
      varuint.encodingLength(this.outs.length) +
      this.ins.reduce(function (sum, input) { return sum + 40 + varSliceSize(input.script) }, 0) +
      this.outs.reduce(function (sum, output) { return sum + 8 + varSliceSize(output.script) }, 0) +
      (hasWitnesses ? this.ins.reduce(function (sum, input) { return sum + vectorSize(input.witness) }, 0) : 0)
    )
  }

  Transaction.prototype.weight = function () {
    var base = this.__byteLength(false)
    var total = this.__byteLength(true)
    return base * 3 + total
  }

  Transaction.prototype.virtualSize = function () {
    return Math.ceil(this.weight() / 4)
  }
```
*/

import {
  getInputComponentsWeight,
  InputComponents,
  inputComponentsP2sh,
  inputComponentsP2shP2pk,
  inputComponentsP2shP2wsh,
  inputComponentsP2trKeySpend,
  inputComponentsP2trScriptSpendLevel1,
  inputComponentsP2trScriptSpendLevel2,
  inputComponentsP2wsh,
} from './inputWeights';

function getVirtualInputSizeFromComponents(components: InputComponents): number {
  return Math.ceil(getInputComponentsWeight(components) / 4);
}

// Constants for signed TX input and output vsizes.
// See https://bitcoincore.org/en/segwit_wallet_dev/#transaction-serialization for full description
// FIXME(BG-9233): use weight units instead
export const VirtualSizes = Object.freeze({
  // FIXME(BG-7873): add support for signature grinding

  // Size of a P2PKH input with (un)compressed key
  /** @deprecated */
  txP2pkhInputSizeCompressedKey: 148,
  /** @deprecated */
  txP2pkhInputSizeUncompressedKey: 180,

  // Input sizes
  txP2shInputSize: getVirtualInputSizeFromComponents(inputComponentsP2sh),
  txP2shP2wshInputSize: getVirtualInputSizeFromComponents(inputComponentsP2shP2wsh),
  txP2wshInputSize: getVirtualInputSizeFromComponents(inputComponentsP2wsh),
  txP2trKeypathInputSize: getVirtualInputSizeFromComponents(inputComponentsP2trKeySpend),
  txP2shP2pkInputSize: getVirtualInputSizeFromComponents(inputComponentsP2shP2pk),
  txP2trScriptPathLevel1InputSize: getVirtualInputSizeFromComponents(inputComponentsP2trScriptSpendLevel1),
  txP2trScriptPathLevel2InputSize: getVirtualInputSizeFromComponents(inputComponentsP2trScriptSpendLevel2),

  //
  // Output sizes
  //

  // The size is calculated as
  //
  //    scriptLength + compactSize(scriptLength) + txOutputAmountSize
  //
  // Since compactSize(scriptLength) is 1 for all scripts considered here, we can simplify this to
  //
  //    scriptLength + 9
  //

  // Size of single output amount
  txOutputAmountSize: 8,

  // https://github.com/bitcoinjs/bitcoinjs-lib/blob/v4.0.2/src/templates/scripthash/output.js#L9
  txP2shOutputSize: 32,
  txP2shP2wshOutputSize: 32,
  // https://github.com/bitcoinjs/bitcoinjs-lib/blob/v4.0.2/src/templates/witnessscripthash/output.js#L9
  txP2wshOutputSize: 43,
  // OP_1 OP_PUSH32 <schnorr_public_key>
  txP2trOutputSize: 43,
  // https://github.com/bitcoinjs/bitcoinjs-lib/blob/v4.0.2/src/templates/pubkeyhash/output.js#L9
  txP2pkhOutputSize: 34,
  // https://github.com/bitcoinjs/bitcoinjs-lib/blob/v4.0.2/src/templates/witnesspubkeyhash/output.js#L9
  txP2wpkhOutputSize: 31,

  /** @deprecated - use txP2pkhOutputSize instead */
  txOutputSize: 34,

  //
  // General tx size constants
  //

  txOverheadSize: 10,
  // Segwit adds one byte each for marker and flag to the witness section.
  // Thus, the vsize is only increased by one.
  txSegOverheadVSize: 11,
});
