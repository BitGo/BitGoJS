import * as utxolib from '@bitgo/utxo-lib';

export type InputFormat = 'asm' | 'parseSignature';

export type TxNodeValue = number | string | Buffer | boolean | undefined | null;

export type TxNode = {
  type: 'node';
  label: string;
  value: TxNodeValue | undefined;
  nodes: TxNode[] | undefined;
};

export type ParserArgs = {
  parseScriptData: boolean;
  parseScriptAsm: boolean;
  parseSignatureData: boolean;
  hide?: string[];
};

function toBufferUInt32BE(n: number): Buffer {
  const buf = Buffer.alloc(4);
  buf.writeUInt32LE(n);
  return buf;
}

const hideDefault = ['sequence', 'locktime'];

export class Parser {
  static PARSE_ALL: ParserArgs = {
    parseScriptData: true,
    parseScriptAsm: true,
    parseSignatureData: true,
    hide: [],
  };

  constructor(private params: ParserArgs) {}

  node(label: string | number, value: TxNodeValue, nodes: TxNode[] = []): TxNode {
    return {
      type: 'node',
      label: String(label),
      value,
      nodes: nodes.filter((n) => !(this.params.hide ?? hideDefault).includes(n.label)),
    };
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

  parseScriptParts(type: string, parts: Array<Buffer | number>): TxNode[] {
    return parts.map((v, i) => {
      let asmNode: TxNode | undefined;
      if (this.params.parseScriptAsm && Buffer.isBuffer(v)) {
        const parsed = this.parseScriptAsm(type, v, i, parts.length);
        asmNode = parsed ? this.node('asm', parsed) : undefined;
      }

      return this.node(i, this.params.parseScriptData ? v : undefined, asmNode ? [asmNode] : undefined);
    });
  }

  parseScript(buffer: Buffer): TxNode {
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

    return this.node('script', value, nodes);
  }

  parseWitness(script: Buffer[]): TxNode {
    if (script.length === 0) {
      return this.node('witness', '[]');
    }
    const type = utxolib.classify.witness(script, true) ?? 'unknown';
    return this.node('witness', type, this.params.parseScriptData ? this.parseScriptParts(type, script) : undefined);
  }

  parseSignatureContent(signatures: (Buffer | 0)[]): TxNode[] {
    if (this.params.parseSignatureData) {
      return signatures.map((sig, i) =>
        this.node(
          i,
          Buffer.isBuffer(sig)
            ? sig.toString('hex')
            : utxolib.bitgo.isPlaceholderSignature(sig)
            ? sig + ' (placeholder)'
            : sig
        )
      );
    }

    return [
      this.node(
        'buffers',
        signatures
          .map((sig) =>
            Buffer.isBuffer(sig) ? `${sig.length}` : utxolib.bitgo.isPlaceholderSignature(sig) ? '(placeholder)' : sig
          )
          .join(' ')
      ),
    ];
  }

  parseSignature(input: utxolib.TxInput): TxNode {
    const parsed = utxolib.bitgo.parseSignatureScript(input);
    let nodes: TxNode[] | undefined;
    switch (parsed.scriptType) {
      case undefined:
        break;
      case 'p2sh':
      case 'p2shP2wsh':
      case 'p2wsh':
      case 'p2tr':
        nodes = this.parseSignatureContent(parsed.signatures);
        break;
    }
    return this.node('signature', parsed.scriptType ?? 'unknown', nodes);
  }

  parseIns(ins: utxolib.TxInput[]): TxNode[] {
    return ins.map((input, i) => {
      return this.node(i, utxolib.bitgo.formatOutputId(utxolib.bitgo.getOutputIdForInput(input)), [
        this.node('sequence', toBufferUInt32BE(input.sequence)),
        this.parseScript(input.script),
        this.parseWitness(input.witness),
        this.parseSignature(input),
      ]);
    });
  }

  parseOuts(outs: utxolib.TxOutput[], network: utxolib.Network): TxNode[] {
    return outs.map((o, i) => {
      return this.node(i, utxolib.address.fromOutputScript(o.script, network), [this.node(`value`, o.value / 1e8)]);
    });
  }

  parse(tx: utxolib.bitgo.UtxoTransaction): TxNode {
    return this.node('transaction', tx.getId(), [
      this.node(
        'parsedAs',
        `${utxolib.getNetworkName(utxolib.getMainnet(tx.network))} ` +
          `${utxolib.isMainnet(tx.network) ? 'mainnet' : 'testnet'}`
      ),
      this.node('version', tx.version),
      this.node('locktime', tx.locktime),
      this.node('hasWitnesses', tx.hasWitnesses()),
      this.node('vsize', `${tx.virtualSize()}vbytes (${tx.weight()}wu)`),
      this.node(`inputs`, tx.ins.length, this.parseIns(tx.ins)),
      this.node(`outputs`, tx.outs.length, this.parseOuts(tx.outs, tx.network)),
    ]);
  }
}
