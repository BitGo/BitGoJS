import * as utxolib from '@bitgo/utxo-lib';

import { Parser, ParserNode } from './Parser';
import { AddressParser } from './AddressParser';
import { formatSat } from './format';
import { ChainInfo } from './TxParser';
import { OutputSpend } from '@bitgo/blockapis';

function toBufferUInt32BE(n: number): Buffer {
  const buf = Buffer.alloc(4);
  buf.writeUInt32LE(n, 0);
  return buf;
}

export class InputOutputParser extends Parser {
  constructor(
    private params: {
      parseOutputScript: boolean;
      parseScriptAsm: boolean;
      parseScriptData: boolean;
      parseSignatureData: boolean;
    }
  ) {
    super();
  }

  parseScriptAsm(type: string, part: Buffer, i: number, n: number): string | undefined {
    if (
      (type === 'taproot' && i === n - 2) ||
      ((type === 'scripthash' || type === 'witnessscripthash') && i === n - 1)
    ) {
      let parsed;

      try {
        parsed = utxolib.script.toASM(part);
      } catch (e) {
        return 'error';
      }

      if (parsed) {
        return ['', ...parsed.split(' ')].join('\n');
      }
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

  parseInputScript(buffer: Buffer): ParserNode {
    let value;
    let nodes;
    if (buffer.length && this.params.parseSignatureData) {
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

  parseWitness(script: Buffer[]): ParserNode {
    if (script.length === 0) {
      return this.node('witness', '[]');
    }
    const type = utxolib.classify.witness(script, true) ?? 'unknown';
    return this.node('witness', type, this.params.parseScriptData ? this.parseScriptParts(type, script) : undefined);
  }

  parsePubkeys(parsed: utxolib.bitgo.ParsedSignatureScript2Of3): ParserNode {
    return this.node(
      'pubkeys',
      parsed.publicKeys.length,
      parsed.publicKeys.map((k, i) => this.node(i, k))
    );
  }

  parseSignatures(
    parsed: utxolib.bitgo.ParsedSignatureScript2Of3,
    tx: utxolib.bitgo.UtxoTransaction,
    inputIndex: number,
    prevOutputs?: utxolib.TxOutput[]
  ): ParserNode {
    const nodes = [];
    if (prevOutputs) {
      const signedBy = utxolib.bitgo.verifySignatureWithPublicKeys(tx, inputIndex, prevOutputs, parsed.publicKeys);
      nodes.push(this.node('signed by', `[${signedBy.flatMap((v, i) => (v ? [i] : [])).join(', ')}]`));
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
  }

  parseSigScript(tx: utxolib.bitgo.UtxoTransaction, inputIndex: number, prevOutputs?: utxolib.TxOutput[]): ParserNode {
    try {
      const parsed = utxolib.bitgo.parseSignatureScript(tx.ins[inputIndex]);
      return this.node(
        'sigScript',
        parsed.scriptType ?? 'unknown',
        parsed.scriptType && utxolib.bitgo.outputScripts.isScriptType2Of3(parsed.scriptType)
          ? [
              this.parsePubkeys(parsed as utxolib.bitgo.ParsedSignatureScript2Of3),
              this.parseSignatures(parsed as utxolib.bitgo.ParsedSignatureScript2Of3, tx, inputIndex, prevOutputs),
            ]
          : []
      );
    } catch (e) {
      return this.node('error', String(e));
    }
  }

  parsePrevOut(
    input: utxolib.TxInput,
    i: number,
    network: utxolib.Network,
    prevOutputs?: utxolib.TxOutput[]
  ): ParserNode[] {
    if (!prevOutputs || !prevOutputs[i]) {
      return [];
    }
    const { script, value } = prevOutputs[i];
    let address;
    try {
      address = utxolib.address.fromOutputScript(script, network);
    } catch (e) {
      address = '(error)';
    }
    return [
      this.node('value', value / 1e8),
      this.node('pubScript', script, address ? [this.node('address', address)] : undefined),
    ];
  }

  parseInput(
    txid: string,
    tx: utxolib.bitgo.UtxoTransaction,
    i: number,
    input: utxolib.TxInput,
    outputInfo: ChainInfo
  ): ParserNode {
    return this.node(i, utxolib.bitgo.formatOutputId(utxolib.bitgo.getOutputIdForInput(input)), [
      this.node('sequence', toBufferUInt32BE(input.sequence)),
      this.parseInputScript(input.script),
      this.parseWitness(input.witness),
      this.parseSigScript(tx, i, outputInfo.prevOutputs),
      ...this.parsePrevOut(input, i, tx.network, outputInfo.prevOutputs),
      ...this.parseSpend(txid, i, outputInfo.prevOutputSpends, { conflict: true }),
    ]);
  }

  parseSpend(
    txid: string,
    index: number,
    spends: OutputSpend[] | undefined,
    params: { conflict: boolean }
  ): ParserNode[] {
    if (!spends || !spends[index]) {
      // no spend data available
      return [];
    }
    const spend = spends[index];
    if (spend.txid === undefined) {
      return [this.node('spent', false)];
    }
    if (spend.txid === txid) {
      // if input is spent by this transaction we don't display it
      return [];
    }
    return [this.node('spent', `${spend.txid}:${spend.vin}`, params.conflict ? [this.node('conflict', true)] : [])];
  }

  parseOutput(txid: string, o: utxolib.TxOutput, i: number, network: utxolib.Network, params: ChainInfo): ParserNode {
    let address;
    try {
      address = utxolib.address.fromOutputScript(o.script, network);
    } catch (e) {
      // ignore
    }

    const addressParser = new AddressParser({ network, all: false, convert: false });

    return this.node(i, address ?? '(no address)', [
      this.node(`value`, formatSat(o.value)),
      ...(this.params.parseOutputScript || address === undefined ? addressParser.parseOutputScript(o.script) : []),
      ...this.parseSpend(txid, i, params.outputSpends, { conflict: false }),
    ]);
  }
}
