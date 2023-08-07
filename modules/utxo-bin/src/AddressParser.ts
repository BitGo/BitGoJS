import * as utxolib from '@bitgo/utxo-lib';
import * as bech32 from 'bech32';

import { Parser, ParserNode } from './Parser';

const bs58 = require('bs58');
const bs58check = require('bs58check');
const cashaddress = require('cashaddress');

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

  parseBase58(address: string): ParserNode[] {
    const payload = bs58.decode(address);
    return [this.node('payload', payload)];
  }

  parseBase58Check(address: string): ParserNode[] {
    const payload = bs58check.decode(address);
    return [
      this.node('payload', payload),
      this.node('version', payload.readUInt8(0).toString('16')),
      this.node('hash', payload.slice(1)),
    ];
  }

  parseWithBechLib(bechlib: bech32.BechLib, address: string): ParserNode[] {
    const decoded = bechlib.decode(address);
    return [
      this.node('prefix', decoded.prefix),
      this.node('words', Buffer.from(decoded.words)),
      this.node('bytes', Buffer.from(bechlib.fromWords(decoded.words))),
    ];
  }

  parseBech32(address: string): ParserNode[] {
    return this.parseWithBechLib(bech32.bech32, address);
  }

  parseBech32m(address: string): ParserNode[] {
    return this.parseWithBechLib(bech32.bech32m, address);
  }

  parseCashaddr(address: string): ParserNode[] {
    const payload = cashaddress.decode(address);
    return [
      this.node('prefix', payload.prefix),
      this.node('version', payload.version),
      this.node('hash', payload.hash),
    ];
  }

  convert(outputScript: Buffer): ParserNode {
    return this.node(
      'converted',
      undefined,
      utxolib.getNetworkList().flatMap((network) =>
        utxolib.addressFormat.addressFormats
          .filter((f) => utxolib.addressFormat.isSupportedAddressFormat(f, network))
          .map((addressFormat) => {
            const name = utxolib.getNetworkName(network) as string;
            try {
              return this.node(
                `${name} ${addressFormat}`,
                utxolib.addressFormat.fromOutputScriptWithFormat(outputScript, addressFormat, network)
              );
            } catch (e) {
              return this.node(`${name} ${addressFormat}`, 'undefined');
            }
          })
      )
    );
  }

  parseToBytes(input: string): ParserNode[] {
    type Decoder = (address: string) => ParserNode[];
    const decodeWith = (name: string, decoder: Decoder): ParserNode[] => {
      try {
        return [this.node(name, undefined, decoder(input))];
      } catch (e) {
        return this.params.all ? [this.node(name, undefined, [this.node('decodeError', String(e))])] : [];
      }
    };

    return [
      ...decodeWith('base58', this.parseBase58.bind(this)),
      ...decodeWith('base58Check', this.parseBase58Check.bind(this)),
      ...decodeWith('bech32', this.parseBech32.bind(this)),
      ...decodeWith('bech32m', this.parseBech32m.bind(this)),
      ...decodeWith('cashaddr', this.parseCashaddr.bind(this)),
    ];
  }

  parse(input: string): ParserNode {
    const networks = this.params.network ? [this.params.network] : utxolib.getNetworkList();

    type Match = {
      network: utxolib.Network;
      address: string;
      addressFormat: utxolib.addressFormat.AddressFormat;
      buffer: Buffer;
    };
    const matches: Match[] = networks.flatMap((network) => {
      try {
        const [addressFormat, buffer] = utxolib.addressFormat.toOutputScriptAndFormat(input, network);
        const address = utxolib.addressFormat.fromOutputScriptWithFormat(buffer, addressFormat, network);
        return [{ network, address, addressFormat, buffer }];
      } catch (e) {
        return [];
      }
    });
    const firstMatch = matches[0];
    const nodes: ParserNode[] = [];

    nodes.push(...this.parseToBytes(input));

    if (firstMatch) {
      if (input !== firstMatch.address) {
        nodes.push(this.node('normalized', firstMatch.address, this.parseToBytes(firstMatch.address)));
      }

      nodes.push(this.node('format', firstMatch.addressFormat));
      nodes.push(this.node('outputScript', firstMatch.buffer, this.parseOutputScript(firstMatch.buffer)));
      nodes.push(this.node('network', matches.map((m) => utxolib.getNetworkName(m.network)).join(', ')));

      if (this.params.all || this.params.convert) {
        nodes.push(this.convert(firstMatch.buffer));
      }
    }

    return this.node('address', input, nodes);
  }
}
