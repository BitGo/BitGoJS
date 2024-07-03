import { Parser, ParserNode } from './Parser';
import * as utxolib from '@bitgo/utxo-lib';
import { parseUnknown } from './parseUnknown';

import * as miniscript from 'wasm-miniscript';

const paymentTypes = ['p2sh', 'p2pkh', 'p2wpkh', 'p2wsh', 'p2ms'] as const;
type PaymentType = (typeof paymentTypes)[number];

function parsePaymentWithType(script: Buffer, type: PaymentType, network?: utxolib.Network): utxolib.Payment {
  switch (type) {
    case 'p2sh':
      return utxolib.payments.p2sh({ redeem: { output: script }, network });
    case 'p2pkh':
      return utxolib.payments.p2pkh({ output: script, network });
    case 'p2wpkh':
      return utxolib.payments.p2wpkh({ output: script, network });
    case 'p2wsh':
      return utxolib.payments.p2wsh({ output: script, network });
    case 'p2ms':
      return utxolib.payments.p2ms({ output: script, network });
  }
}

export class ScriptParser extends Parser {
  network?: utxolib.Network;
  constructor({ network }: { network?: utxolib.Network } = {}) {
    super();
    this.network = network;
  }

  static toASM(script: Buffer, { insertNewlines = true } = {}): string | undefined {
    let parsed;
    try {
      parsed = utxolib.script.toASM(script);
    } catch (e) {
      return 'error';
    }

    if (parsed) {
      return insertNewlines ? ['', ...parsed.split(' ')].join('\n') : parsed;
    }
  }

  static classify(
    script: Buffer | undefined,
    witness: Buffer[] | undefined
  ): {
    input: string | undefined;
    output: string | undefined;
    witness: string | undefined;
  } {
    return {
      input: script ? utxolib.classify.input(script, /* allowIncomplete */ true) : undefined,
      output: script ? utxolib.classify.output(script) : undefined,
      witness: witness ? utxolib.classify.witness(witness) : undefined,
    };
  }

  parsePayment(payment: utxolib.Payment): ParserNode {
    return parseUnknown(this, `payment: ${payment.name}`, payment, {
      omit: ['network', 'name'],
    });
  }

  parseBufferAsPayment(script: Buffer): ParserNode[] {
    return paymentTypes.flatMap((type) => {
      try {
        return [this.parsePayment(parsePaymentWithType(script, type, this.network))];
      } catch (e) {
        return [];
      }
    });
  }

  toMiniscript(script: Buffer, ctx?: 'legacy' | 'segwitv0' | 'tap'): ParserNode[] {
    if (ctx === undefined) {
      for (const ctx of ['legacy', 'segwitv0', 'tap'] as const) {
        try {
          return this.toMiniscript(script, ctx);
        } catch (e) {
          // ignore
        }
      }
      return [this.node('miniscript', 'error: could not parse miniscript')];
    }

    let ms: string;
    switch (ctx) {
      case 'legacy':
        ms = miniscript.miniscript_from_script_legacy(script);
        break;
      case 'segwitv0':
        ms = miniscript.miniscript_from_script_segwit_v0(script);
        break;
      case 'tap':
        ms = miniscript.miniscript_from_string_tap(script);
        break;
    }
    if (!ms) {
      throw new Error('could not parse miniscript');
    }
    return [this.node('context', ctx), this.node('miniscript', ms)];
  }

  parse(script: Buffer): ParserNode {
    const classification = ScriptParser.classify(script, undefined);
    const decompiled = utxolib.script.decompile(script);
    return this.node('script', `length ${script.length} bytes`, [
      this.node('classification', undefined, [
        this.node('input', classification.input),
        this.node('output', classification.output),
        this.node('witness', classification.witness),
      ]),
      this.node('asm', ScriptParser.toASM(script)),
      this.node('decompiled', undefined, decompiled ? decompiled.map((v, i) => this.node(i, v)) : undefined),
      this.node('miniscript', undefined, this.toMiniscript(script)),
      ...this.parseBufferAsPayment(script),
    ]);
  }
}
