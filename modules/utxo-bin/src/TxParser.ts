import { OutputSpend, TransactionStatus } from '@bitgo/blockapis';
import * as utxolib from '@bitgo/utxo-lib';
import { Parser, ParserNode } from './Parser';
import { formatSat } from './format';
import { InputOutputParser } from './InputOutputParser';
import { PsbtTxInput } from '@bitgo/utxo-lib';

function formatConsensusBranchId(branchId: number): string {
  const map: Record<string, number> = {
    OVERWINTER_BRANCH_ID: 0x5ba81b19,
    CANOPY_BRANCH_ID: 0xe9ff75a6,
    NU5_BRANCH_ID: 0xc2d6d0b4,
  };
  return Object.keys(map).find((k) => map[k] === branchId) ?? 'unknown';
}

export type TxParserArgs = {
  parseScriptData: boolean;
  parseScriptAsm: boolean;
  parseOutputScript: boolean;
  parseSignatureData: {
    script: boolean;
    ecdsa: boolean;
    schnorr: boolean;
  };
  hide?: string[];
  maxOutputs?: number;
  vin?: number[];
};

export type ChainInfo = {
  status?: TransactionStatus;
  outputSpends?: OutputSpend[];
  prevOutputs?: utxolib.TxOutput[];
  prevOutputSpends?: OutputSpend[];
};

export class TxParser extends Parser {
  static PARSE_ALL: TxParserArgs = {
    parseScriptData: true,
    parseScriptAsm: true,
    parseOutputScript: true,
    parseSignatureData: {
      script: true,
      ecdsa: true,
      schnorr: true,
    },
  };

  constructor(private params: TxParserArgs) {
    super();
  }

  parseIns(
    ins: utxolib.TxInput[],
    tx: utxolib.bitgo.UtxoTransaction<number | bigint>,
    outputInfo: ChainInfo
  ): ParserNode[] {
    const txid = tx.getId();
    const ioParser = new InputOutputParser(this.params);
    return ins.flatMap((input, i) =>
      this.params.vin === undefined || this.params.vin.includes(i)
        ? [ioParser.parseInput(txid, tx, i, tx.ins[i], outputInfo)]
        : []
    );
  }

  parseInsPsbt(ins: PsbtTxInput[], tx: utxolib.bitgo.UtxoPsbt): ParserNode[] {
    const ioParser = new InputOutputParser(this.params);
    return ins.flatMap((input, i) =>
      this.params.vin === undefined || this.params.vin.includes(i) ? [ioParser.parsePsbtTxInput(tx, input, i)] : []
    );
  }

  parseOuts(
    outs: utxolib.TxOutput<number | bigint>[],
    tx: utxolib.bitgo.UtxoTransaction<number | bigint>,
    params: ChainInfo
  ): ParserNode[] {
    if (outs.length > (this.params.maxOutputs ?? 200)) {
      return [this.node('(omitted)', undefined)];
    }

    const txid = tx.getId();
    const ioParser = new InputOutputParser(this.params);
    return outs.map((o, i) => ioParser.parseOutput(txid, o, i, tx.network, params));
  }

  parseStatus(tx: utxolib.bitgo.UtxoTransaction<number | bigint>, status?: TransactionStatus): ParserNode[] {
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

  parseVersion(tx: utxolib.bitgo.UtxoTransaction<number | bigint>): ParserNode {
    return this.node(
      'version',
      tx.version,
      tx instanceof utxolib.bitgo.ZcashTransaction
        ? [
            this.node('consensusBranchId (inferred)', tx.consensusBranchId.toString(16), [
              this.node('name', formatConsensusBranchId(tx.consensusBranchId)),
            ]),
          ]
        : []
    );
  }

  parseLegacy(tx: utxolib.bitgo.UtxoTransaction<number | bigint>, chainInfo: ChainInfo = {}): ParserNode {
    const weight = tx.weight();
    const vsize = tx.virtualSize();
    const outputSum = tx.outs.reduce((sum, o) => sum + BigInt(o.value), BigInt(0));
    const inputSum = chainInfo.prevOutputs?.reduce((sum, o) => sum + BigInt(o.value), BigInt(0));
    const fee = inputSum ? inputSum - outputSum : undefined;
    const feeRate = fee ? Number(fee) / vsize : undefined;
    return this.node('transaction', tx.getId(), [
      this.node(
        'parsedAs',
        `${utxolib.getNetworkName(utxolib.getMainnet(tx.network))} ` +
          `${utxolib.isMainnet(tx.network) ? 'mainnet' : 'testnet'}`
      ),
      this.parseVersion(tx),
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

  parsePsbt(tx: utxolib.bitgo.UtxoPsbt, chainInfo: ChainInfo = {}): ParserNode {
    return this.node('psbt', undefined, [
      this.node('version', tx.version),
      // this.parseLegacy(tx.getUnsignedTx(), chainInfo),
      this.node('inputs', undefined, this.parseInsPsbt(tx.txInputs, tx)),
    ]);
  }

  parse(tx: utxolib.bitgo.UtxoTransaction | utxolib.bitgo.UtxoPsbt, chainInfo: ChainInfo = {}): ParserNode {
    return tx instanceof utxolib.bitgo.UtxoTransaction
      ? this.parseLegacy(tx, chainInfo)
      : this.parsePsbt(tx, chainInfo);
  }
}
