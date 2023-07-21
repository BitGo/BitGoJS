import * as utxolib from '@bitgo/utxo-lib';
import { Parser, ParserNode } from './Parser';
import { getParserTxInputProperties, getPrevOut, ParserTx, ParserTxInput } from './ParserTx';
import { getHollowSpendMessage, HollowSegwitSpend, parseHollowSegwitSpend } from './hollowSegwitSpend';
import { script, ScriptSignature } from 'bitcoinjs-lib';
import { isHighS } from './ecdsa';
import { ChainInfo } from './TxParser';
import { OutputParser } from './OutputParser';
import { parseUnknown } from './parseUnknown';
import { ScriptParser } from './ScriptParser';

type ParsedSignatureScript =
  | utxolib.bitgo.ParsedSignatureScriptP2ms
  | utxolib.bitgo.ParsedSignatureScriptP2shP2pk
  | utxolib.bitgo.ParsedSignatureScriptTaproot
  | utxolib.bitgo.ParsedPsbtP2ms
  | utxolib.bitgo.ParsedPsbtP2shP2pk
  | utxolib.bitgo.ParsedPsbtTaproot
  | HollowSegwitSpend;

function getOutputId(v: { hash: Buffer; index: number }): string {
  return utxolib.bitgo.formatOutputId(utxolib.bitgo.getOutputIdForInput(v));
}

function parseSignatureScript(tx: ParserTx, inputIndex: number, network: utxolib.Network): ParsedSignatureScript {
  if (tx instanceof utxolib.bitgo.UtxoTransaction) {
    return (
      parseHollowSegwitSpend(tx.ins[inputIndex], network) || utxolib.bitgo.parseSignatureScript(tx.ins[inputIndex])
    );
  }
  return utxolib.bitgo.parsePsbtInput(tx.data.inputs[inputIndex]);
}

function toBufferUInt32BE(n: number): Buffer {
  const buf = Buffer.alloc(4);
  buf.writeUInt32LE(n, 0);
  return buf;
}

export class InputParser extends Parser {
  private input: ParserTxInput;

  constructor(
    private txid: string,
    private tx: ParserTx,
    private inputIndex: number,
    private chainInfo: ChainInfo,
    private params: {
      parseOutputScript: boolean;
      parseScriptAsm: boolean;
      parseScriptData: boolean;
      parseSignatureData: {
        script: boolean;
        ecdsa: boolean;
        schnorr: boolean;
      };
      parseError?: 'throw' | 'continue';
    }
  ) {
    super({ parseError: params.parseError });
    if (tx instanceof utxolib.bitgo.UtxoTransaction) {
      this.input = tx.ins[inputIndex];
    } else if (tx instanceof utxolib.bitgo.UtxoPsbt) {
      this.input = tx.txInputs[inputIndex];
    } else {
      throw new Error('unknown transaction type');
    }
  }

  parseScriptAsm(type: string, part: Buffer, i: number, n: number): string | undefined {
    if (
      (type === 'taproot' && i === n - 2) ||
      ((type === 'scripthash' || type === 'witnessscripthash') && i === n - 1)
    ) {
      return ScriptParser.toASM(part);
    }
  }

  parseScriptParts(type: string, parts: Array<Buffer | number>): ParserNode[] {
    return parts.map((v, i) => {
      let asmNode: ParserNode | undefined;
      if (this.params.parseScriptAsm && Buffer.isBuffer(v)) {
        const parsed = this.parseScriptAsm(type, v, i, parts.length);
        asmNode = parsed ? this.node('asm', parsed) : undefined;
      }

      return this.node(i, this.params.parseScriptData ? v : undefined, asmNode ? [asmNode] : undefined);
    });
  }

  parseInputScript(buffer: Buffer | undefined): ParserNode {
    let value;
    let nodes;
    if (buffer && buffer.length && this.params.parseSignatureData.script) {
      const type = utxolib.classify.input(buffer, true) ?? 'unknown';
      const decompiled = utxolib.script.decompile(buffer);
      if (decompiled) {
        nodes = this.parseScriptParts(type, decompiled);
      }
      value = type;
    } else {
      value = buffer;
    }

    return this.node('scriptSig', value, nodes);
  }

  parseWitness(script: Buffer[] | undefined): ParserNode {
    if (!script || script.length === 0) {
      return this.node('witness', '[]');
    }
    const type = utxolib.classify.witness(script, true) ?? 'unknown';
    return this.node('witness', type, this.params.parseScriptData ? this.parseScriptParts(type, script) : undefined);
  }

  parsePubkeys(parsed: ParsedSignatureScript): ParserNode {
    if ('publicKeys' in parsed) {
      return this.node(
        'pubkeys',
        parsed.publicKeys.length,
        parsed.publicKeys.map((k, i) => this.node(i, k))
      );
    } else {
      return this.node('pubkeys', '[]');
    }
  }

  parseSignatureBuffer(
    type:
      | utxolib.bitgo.outputScripts.ScriptType2Of3
      | utxolib.bitgo.ParsedScriptType2Of3
      | utxolib.bitgo.outputScripts.ScriptTypeP2shP2pk,
    buf: Buffer | 0,
    signerIndex: number | undefined
  ): ParserNode[] {
    if (buf === 0) {
      return [this.node('type', 'placeholder (0)')];
    }

    const nodes = [this.node('bytes', buf)];
    if (signerIndex !== undefined) {
      nodes.push(this.node('valid', 0 <= signerIndex));
      if (0 <= signerIndex) {
        nodes.push(this.node('signedBy', ['user', 'backup', 'bitgo'][signerIndex]));
      }
    }

    if (type === 'taprootScriptPathSpend' || type === 'taprootKeyPathSpend') {
      // TODO
    } else {
      const { signature, hashType } = ScriptSignature.decode(buf);
      const r = signature.subarray(0, 32);
      const s = signature.subarray(32);

      if (r.length !== 32 || s.length !== 32) {
        throw new Error(`invalid scalar length`);
      }

      nodes.push(
        this.node('isCanonical', script.isCanonicalScriptSignature(buf)),
        this.node('hashType', hashType),
        this.node('r', r),
        this.node('s', s),
        this.node('highS', isHighS(s))
      );
    }

    return nodes;
  }

  parseSignaturesWithSigners(
    parsed: {
      scriptType:
        | utxolib.bitgo.outputScripts.ScriptType2Of3
        | utxolib.bitgo.outputScripts.ScriptTypeP2shP2pk
        | utxolib.bitgo.ParsedScriptType2Of3;
      signatures: (Buffer | 0)[];
    },
    signedByLabels: string[] | undefined,
    signerIndex: number[] | undefined
  ): ParserNode[] {
    const nodes = signedByLabels ? [this.node('signed by', `[${signedByLabels.join(', ')}]`)] : [];
    if (this.params.parseSignatureData.ecdsa || this.params.parseSignatureData.schnorr) {
      nodes.push(
        ...parsed.signatures.map((s: Buffer | 0, i: number) =>
          this.node(
            i,
            undefined,
            this.parseSignatureBuffer(parsed.scriptType, s, signerIndex ? signerIndex[i] : undefined)
          )
        )
      );
    }
    return nodes;
  }

  parseSignatures(parsed: ParsedSignatureScript): ParserNode {
    const nodes: ParserNode[] = [];
    if (
      'signatures' in parsed &&
      'publicKeys' in parsed &&
      'scriptType' in parsed &&
      parsed.signatures !== undefined &&
      parsed.scriptType !== undefined
    ) {
      if (this.tx instanceof utxolib.bitgo.UtxoTransaction && this.chainInfo.prevOutputs) {
        const signedBy = utxolib.bitgo.getSignaturesWithPublicKeys(
          this.tx,
          this.inputIndex,
          this.chainInfo.prevOutputs,
          parsed.publicKeys
        );
        nodes.push(
          ...this.parseSignaturesWithSigners(
            parsed,
            signedBy.flatMap((v, i) => (v ? [i.toString()] : [])),
            parsed.signatures.map((k: Buffer | 0) => (k === 0 ? -1 : signedBy.indexOf(k)))
          )
        );
      }
      if (this.tx instanceof utxolib.bitgo.UtxoPsbt) {
        let signedByLabels: string[] | undefined;
        if (parsed.publicKeys && Array.isArray(parsed.publicKeys)) {
          const psbt = this.tx;
          signedByLabels = parsed.publicKeys.flatMap((k: Buffer, i) =>
            Buffer.isBuffer(k) && psbt.validateSignaturesOfInputCommon(this.inputIndex, k) ? [i.toString()] : []
          );
        }
        // TODO: the current UtxoPsbt API does not allow us to determine which signer created which signature
        const signerIndex = undefined;
        nodes.push(...this.parseSignaturesWithSigners(parsed, signedByLabels, signerIndex));
      }
      return this.node(
        'signatures',
        parsed.signatures
          .map((s: Buffer | 0) =>
            utxolib.bitgo.isPlaceholderSignature(s) ? '[]' : Buffer.isBuffer(s) ? `[${s.length}byte]` : `[${s}]`
          )
          .join(' '),
        nodes
      );
    } else if ('signatures' in parsed) {
      return this.node(
        'signatures',
        undefined,
        (parsed.signatures ?? []).map((s: Buffer | 0, i: number) => this.node(i, s))
      );
    } else {
      return this.node('signatures', undefined);
    }
  }

  parseSigScriptWithType(parsed: ParsedSignatureScript): ParserNode {
    if (
      parsed.scriptType &&
      (utxolib.bitgo.outputScripts.isScriptType2Of3(parsed.scriptType) ||
        parsed.scriptType === 'taprootScriptPathSpend' ||
        parsed.scriptType === 'taprootKeyPathSpend')
    ) {
      return this.node('sigScript', parsed.scriptType, [this.parsePubkeys(parsed), this.parseSignatures(parsed)]);
    }

    if (parsed.scriptType === 'p2shP2wshHollow' || parsed.scriptType === 'p2shP2wpkhHollow') {
      return this.node('sigScript', parsed.scriptType, [this.node('info', getHollowSpendMessage())]);
    }

    return this.node('sigScript', parsed.scriptType ?? 'unknown');
  }

  parseSigScript(): ParserNode {
    try {
      return this.parseSigScriptWithType(parseSignatureScript(this.tx, this.inputIndex, this.tx.network));
    } catch (e) {
      return this.handleParseError(e);
    }
  }

  parsePrevOut(prevOutput: utxolib.TxOutput<bigint> | utxolib.bitgo.PsbtInput): ParserNode[] {
    let script: Buffer;
    let value: bigint;
    if ('script' in prevOutput && prevOutput.script) {
      ({ script, value } = prevOutput);
    } else if ('witnessUtxo' in prevOutput || 'nonWitnessUtxo' in prevOutput) {
      if (!(this.tx instanceof utxolib.bitgo.UtxoPsbt)) {
        throw new Error('invalid state');
      }
      const result = getPrevOut(prevOutput, this.tx.txInputs[this.inputIndex], this.tx.network);
      if (!result) {
        return [this.node('script', 'unknown'), this.node('value', 'unknown')];
      }
      ({ script, value } = result);
    } else {
      throw new Error('invalid prevOutput');
    }

    let address;
    try {
      address = utxolib.address.fromOutputScript(script, this.tx.network);
    } catch (e) {
      address = '(error)';
    }
    return [
      this.node('value', Number(value) / 1e8),
      this.node('pubScript', script, address ? [this.node('address', address)] : undefined),
    ];
  }

  parsePsbtInput(input: utxolib.bitgo.PsbtInput): ParserNode[] {
    return Object.entries({
      musig2Participants: utxolib.bitgo.musig2.parsePsbtMusig2Participants(input),
      musig2Nonces: utxolib.bitgo.musig2.parsePsbtMusig2Nonces(input),
      musig2PartialSignatures: utxolib.bitgo.musig2.parsePsbtMusig2PartialSigs(input),
    }).flatMap(([key, value]) => (value ? [parseUnknown(this, key, value)] : []));
  }

  parseInput(): ParserNode {
    const psbtInput = this.tx instanceof utxolib.bitgo.UtxoPsbt ? this.tx.data.inputs[this.inputIndex] : undefined;
    const { txid: prevTxid, vout, sequence, script, witness } = getParserTxInputProperties(this.input, psbtInput);
    const prevOutput = this.chainInfo.prevOutputs?.[this.inputIndex];
    return this.node(this.inputIndex, getOutputId(this.input), [
      this.node('sequence', sequence === undefined ? undefined : toBufferUInt32BE(sequence)),
      this.parseInputScript(script),
      this.parseWitness(witness),
      this.parseSigScript(),
      ...(psbtInput ? this.parsePrevOut(psbtInput) : []),
      ...(prevOutput
        ? new OutputParser(this.tx.network, prevTxid, vout, prevOutput, this.chainInfo, this.params).parseSpend({
            conflict: true,
          })
        : []),
      ...(psbtInput ? this.parsePsbtInput(psbtInput) : []),
    ]);
  }
}
