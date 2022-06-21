import * as utxolib from '@bitgo/utxo-lib';
import { OutputSpend, TransactionStatus } from '@bitgo/blockapis';

export type InputFormat = 'asm' | 'parseSignature';

export type TxNodeValue = number | string | Buffer | boolean | undefined | null;

function formatSat(v: number): string {
  return (v / 1e8).toFixed(8);
}

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
  maxOutputs?: number;
};

export type ChainInfo = {
  status?: TransactionStatus;
  outputSpends?: OutputSpend[];
  prevOutputs?: utxolib.TxOutput[];
  prevOutputSpends?: OutputSpend[];
};

function toBufferUInt32BE(n: number): Buffer {
  const buf = Buffer.alloc(4);
  buf.writeUInt32LE(n, 0);
  return buf;
}

function isPrintable(s: string): boolean {
  // https://stackoverflow.com/a/66447494
  return !s.match(/[\p{Cc}\p{Cn}\p{Cs}]+/gu);
}

export class Parser {
  static PARSE_ALL: ParserArgs = {
    parseScriptData: true,
    parseScriptAsm: true,
    parseSignatureData: true,
  };

  constructor(private params: ParserArgs) {}

  node(label: string | number, value: TxNodeValue, nodes: TxNode[] = []): TxNode {
    return {
      type: 'node',
      label: String(label),
      value,
      nodes,
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

  parsePubkeys(parsed: utxolib.bitgo.ParsedSignatureScript2Of3): TxNode {
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
  ): TxNode {
    const nodes = [];
    if (prevOutputs) {
      const signedBy = utxolib.bitgo.verifySignatureWithPublicKeys(tx, inputIndex, prevOutputs, parsed.publicKeys);
      nodes.push(this.node('signed by', signedBy.flatMap((v, i) => (v ? [i] : [])).join(', ')));
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

  parseSigScript(tx: utxolib.bitgo.UtxoTransaction, inputIndex: number, prevOutputs?: utxolib.TxOutput[]): TxNode {
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
  ): TxNode[] {
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

  parseSpend(txid: string, index: number, spends: OutputSpend[] | undefined, params: { conflict: boolean }): TxNode[] {
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

  parseIns(ins: utxolib.TxInput[], tx: utxolib.bitgo.UtxoTransaction, outputInfo: ChainInfo): TxNode[] {
    const txid = tx.getId();
    return ins.map((input, i) => {
      return this.node(i, utxolib.bitgo.formatOutputId(utxolib.bitgo.getOutputIdForInput(input)), [
        this.node('sequence', toBufferUInt32BE(input.sequence)),
        this.parseScript(input.script),
        this.parseWitness(input.witness),
        this.parseSigScript(tx, i, outputInfo.prevOutputs),
        ...this.parsePrevOut(input, i, tx.network, outputInfo.prevOutputs),
        ...this.parseSpend(txid, i, outputInfo.prevOutputSpends, { conflict: true }),
      ]);
    });
  }

  tryParseOpReturn(script: Buffer): TxNode[] {
    let data: Buffer[] | undefined;
    try {
      ({ data } = utxolib.payments.embed({ output: script }));
    } catch (e) {
      // ignore
    }
    if (!data) {
      return [];
    }
    return data.map((buf, i) => {
      let utf8;
      try {
        utf8 = buf.toString('utf8');
      } catch (e) {
        // ignore
      }
      return this.node(i, `${buf.length} bytes`, [
        this.node('hex', buf),
        ...(utf8 && isPrintable(utf8) ? [this.node('utf8', utf8)] : []),
      ]);
    });
  }

  tryFormatAddress(script: Buffer, network: utxolib.Network): string | Buffer {
    const opReturnNodes = this.tryParseOpReturn(script);
    if (opReturnNodes.length) {
      return `OP_RETURN`;
    }

    try {
      return utxolib.address.fromOutputScript(script, network);
    } catch (e) {
      return script;
    }
  }

  parseOuts(outs: utxolib.TxOutput[], tx: utxolib.bitgo.UtxoTransaction, params: ChainInfo): TxNode[] {
    if (outs.length > (this.params.maxOutputs ?? 200)) {
      return [this.node('(omitted)', undefined)];
    }

    const txid = tx.getId();
    return outs.map((o, i) =>
      this.node(i, this.tryFormatAddress(o.script, tx.network), [
        ...this.tryParseOpReturn(o.script),
        this.node(`value`, o.value / 1e8),
        ...this.parseSpend(txid, i, params.outputSpends, { conflict: false }),
      ])
    );
  }

  parseStatus(tx: utxolib.bitgo.UtxoTransaction, status?: TransactionStatus): TxNode[] {
    if (!status) {
      return [this.node('status', 'unknown')];
    }
    return [
      this.node(
        'status',
        status.found ? 'found' : 'not found',
        status.found
          ? status.confirmed
            ? [
                this.node(
                  'confirmed',
                  `block ${status.blockHeight}` + (status.date ? ` date=${status.date.toISOString()}` : '')
                ),
              ]
            : [this.node('confirmed', false)]
          : []
      ),
    ];
  }

  parse(tx: utxolib.bitgo.UtxoTransaction, chainInfo: ChainInfo = {}): TxNode {
    const weight = tx.weight();
    const vsize = tx.virtualSize();
    const outputSum = tx.outs.reduce((sum, o) => sum + o.value, 0);
    const inputSum = chainInfo.prevOutputs?.reduce((sum, o) => sum + o.value, 0);
    const fee = inputSum ? inputSum - outputSum : undefined;
    const feeRate = fee ? fee / vsize : undefined;
    return this.node('transaction', tx.getId(), [
      this.node(
        'parsedAs',
        `${utxolib.getNetworkName(utxolib.getMainnet(tx.network))} ` +
          `${utxolib.isMainnet(tx.network) ? 'mainnet' : 'testnet'}`
      ),
      this.node('version', tx.version),
      this.node('locktime', tx.locktime),
      this.node('hasWitnesses', tx.hasWitnesses()),
      ...this.parseStatus(tx, chainInfo.status),
      this.node('vsize', `${vsize}vbytes (${weight}wu)`),
      ...(fee && feeRate
        ? [this.node('fee [btc]', formatSat(fee)), this.node('feeRate [sat/vbyte]', feeRate.toFixed(2))]
        : []),
      this.node(
        `inputs`,
        [String(tx.ins.length)].concat(inputSum ? ['sum=' + formatSat(inputSum)] : []).join(' '),
        this.parseIns(tx.ins, tx, chainInfo)
      ),
      this.node(
        `outputs`,
        [String(tx.outs.length), 'sum=' + formatSat(outputSum)].join(' '),
        this.parseOuts(tx.outs, tx, chainInfo)
      ),
    ]);
  }
}
