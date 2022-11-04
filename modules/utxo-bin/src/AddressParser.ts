import * as utxolib from '@bitgo/utxo-lib';
import { Parser, ParserNode } from './Parser';

const bs58check = require('bs58check');

function isPrintable(s: string): boolean {
  // https://stackoverflow.com/a/66447494
  return !s.match(/[\p{Cc}\p{Cn}\p{Cs}]+/gu);
}

export class AddressParser extends Parser {
  constructor(
    public params: {
      network?: utxolib.Network;
      all: boolean;
      convert: boolean;
    }
  ) {
    super();
  }

  tryParseOpReturn(script: Buffer): ParserNode[] {
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
      return this.node(`OP_RETURN ${i}`, `${buf.length} bytes`, [
        this.node('hex', buf),
        ...(utf8 && isPrintable(utf8) ? [this.node('utf8', utf8)] : []),
      ]);
    });
  }

  parseOutputScript(buffer: Buffer): ParserNode[] {
    return [
      this.node('scriptPubKey', `[${buffer.length}byte]`, [
        this.node('type', utxolib.classify.output(buffer)),
        this.node('hex', buffer.toString('hex')),
        this.node('asm', utxolib.script.toASM(buffer), this.tryParseOpReturn(buffer)),
      ]),
    ];
  }

  parseBase58(address: string): ParserNode {
    const payload = bs58check.decode(address);
    return this.node('base58Check', payload, [
      this.node('version', payload.readUInt8(0).toString('16')),
      this.node('hash', payload.slice(1)),
    ]);
  }

  parse(address: string): ParserNode {
    const networks = this.params.network ? [this.params.network] : utxolib.getNetworkList();
    const matches = networks.flatMap((network) => {
      try {
        return { network, buffer: utxolib.address.toOutputScript(address, network) };
      } catch (e) {
        return [];
      }
    });
    const firstMatch = matches[0];
    const nodes = [];

    try {
      nodes.push(this.parseBase58(address));
      // eslint-disable-next-line no-empty
    } catch (e) {}

    if (firstMatch) {
      nodes.push(this.node('outputScript', firstMatch.buffer, this.parseOutputScript(firstMatch.buffer)));
      nodes.push(this.node('network', matches.map((m) => utxolib.getNetworkName(m.network)).join(', ')));
      if (this.params.all || this.params.convert) {
        nodes.push(
          this.node(
            'converted',
            undefined,
            utxolib.getNetworkList().flatMap((network) => {
              const name = utxolib.getNetworkName(network) as string;
              try {
                return [this.node(name, utxolib.address.fromOutputScript(firstMatch.buffer, network))];
              } catch (e) {
                return [this.node(name, 'undefined')];
              }
            })
          )
        );
      }
    }
    return this.node('address', address, nodes);
  }
}
