import * as utxolib from '@bitgo/utxo-lib';
import { ChainInfo } from './TxParser';
import { Parser, ParserNode } from './Parser';
import { AddressParser } from './AddressParser';
import { formatSat } from './format';
import { Network } from '@bitgo/utxo-lib';

export class OutputParser extends Parser {
  constructor(
    private network: Network,
    private txid: string,
    private outputIndex: number,
    private output: { script: Buffer; value: bigint },
    private chainInfo: ChainInfo,
    private params: {
      parseOutputScript: boolean;
      parseError?: 'throw' | 'continue';
    }
  ) {
    super(params);
  }

  parseSpend(params: { conflict: boolean }): ParserNode[] {
    if (!this.chainInfo.prevOutputSpends || !this.chainInfo.prevOutputSpends[this.outputIndex]) {
      // no spend data available
      return [];
    }
    const spend = this.chainInfo.prevOutputSpends[this.outputIndex];
    if (spend.txid === undefined) {
      return [this.node('spent', false)];
    }
    if (spend.txid === this.txid) {
      // if input is spent by this transaction we don't display it
      return [];
    }
    return [this.node('spent', `${spend.txid}:${spend.vin}`, params.conflict ? [this.node('conflict', true)] : [])];
  }

  parseOutput(): ParserNode {
    let address;
    try {
      address = utxolib.address.fromOutputScript(this.output.script, this.network);
    } catch (e) {
      // ignore
    }

    const addressParser = new AddressParser({ network: this.network, all: false, convert: false });

    return this.node(this.outputIndex, address ?? '(no address)', [
      this.node(`value`, formatSat(this.output.value)),
      ...(this.params.parseOutputScript || address === undefined
        ? addressParser.parseOutputScript(this.output.script)
        : []),
      ...this.parseSpend({ conflict: false }),
    ]);
  }
}
