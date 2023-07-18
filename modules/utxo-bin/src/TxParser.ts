import { OutputSpend, TransactionStatus } from '@bitgo/blockapis';
import * as utxolib from '@bitgo/utxo-lib';
import { Parser, ParserNode } from './Parser';
import { formatSat } from './format';
import { getParserTxProperties, ParserTx, ParserTxInput, ParserTxOutput } from './ParserTx';
import { InputParser } from './InputParser';
import { OutputParser } from './OutputParser';

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
  parseAsUnknown: boolean;
  hide?: string[];
  maxOutputs?: number;
  vin?: number[];
  parseError?: 'throw' | 'continue';
};

export type ChainInfo = {
  status?: TransactionStatus;
  outputSpends?: OutputSpend[];
  prevOutputs?: utxolib.TxOutput<bigint>[];
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
    parseAsUnknown: false,
  };

  constructor(private params: TxParserArgs) {
    super(params);
  }

  parseIns(ins: ParserTxInput[], tx: ParserTx, txid: string, outputInfo: ChainInfo): ParserNode[] {
    return ins.flatMap((input: ParserTxInput, i: number) =>
      this.params.vin === undefined || this.params.vin.includes(i)
        ? [new InputParser(txid, tx, i, outputInfo, this.params).parseInput()]
        : []
    );
  }

  parseOuts(outs: ParserTxOutput[], tx: ParserTx, txid: string, params: ChainInfo): ParserNode[] {
    if (outs.length > (this.params.maxOutputs ?? 200)) {
      return [this.node('(omitted)', undefined)];
    }

    return outs.map((o, i) => new OutputParser(tx.network, txid, i, o, params, this.params).parseOutput());
  }

  parseStatus(status?: TransactionStatus): ParserNode[] {
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

  parseVersion(tx: utxolib.bitgo.UtxoTransaction<bigint> | utxolib.bitgo.UtxoPsbt): ParserNode {
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

  parse(tx: ParserTx, chainInfo: ChainInfo = {}): ParserNode {
    const { format, complete, id, weight, inputs, outputs, hasWitnesses, inputSum, outputSum } = getParserTxProperties(
      tx,
      chainInfo.prevOutputs
    );
    const vsize = weight === undefined ? undefined : Math.ceil(weight / 4);
    const fee = inputSum ? inputSum - outputSum : undefined;
    const feeRate = fee && vsize ? Number(fee) / vsize : undefined;
    return this.node('transaction', id, [
      this.node('format', format),
      this.node('complete', complete),
      this.node(
        'parsedAs',
        `${utxolib.getNetworkName(utxolib.getMainnet(tx.network))} ` +
          `${utxolib.isMainnet(tx.network) ? 'mainnet' : 'testnet'}`
      ),
      this.parseVersion(tx),
      this.node('locktime', tx.locktime),
      this.node('hasWitnesses', hasWitnesses),
      ...this.parseStatus(chainInfo.status),
      this.node('vsize', `${vsize}vbytes (${weight}wu)`),
      ...(fee && feeRate
        ? [this.node('fee [btc]', formatSat(fee)), this.node('feeRate [sat/vbyte]', feeRate.toFixed(2))]
        : []),
      this.node(
        `inputs`,
        [inputs.length.toString()].concat(inputSum ? ['sum=' + formatSat(inputSum)] : []).join(' '),
        this.parseIns(inputs, tx, id, chainInfo)
      ),
      this.node(
        `outputs`,
        [outputs.length.toString(), 'sum=' + formatSat(outputSum)].join(' '),
        this.parseOuts(outputs, tx, id, chainInfo)
      ),
    ]);
  }
}
