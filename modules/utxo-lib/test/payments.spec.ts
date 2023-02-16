import * as assert from 'assert';
import { describe, it } from 'mocha';
import { ecc } from '../src';
import { PaymentCreator } from 'bitcoinjs-lib';
import * as u from './payments.utils';
import { TinySecp256k1Interface } from '../src/taproot';

['p2tr', 'p2tr_ns'].forEach((p) => {
  describe(p, () => {
    let fn: PaymentCreator;
    const payment = require('../src/payments/' + p);
    const eccLib: TinySecp256k1Interface | undefined = p.startsWith('p2tr') ? ecc : undefined;
    if (p === 'embed') {
      fn = payment.p2data;
    } else {
      fn = payment[p];
    }
    const fixtures = require('./fixtures/' + p);

    fixtures.valid.forEach((f: any) => {
      it(f.description + ' as expected', () => {
        const args = u.preform(f.arguments);
        const actual = fn(args, Object.assign({ eccLib }, f.options));

        u.equate(actual, f.expected, f.arguments);
      });

      it(f.description + ' as expected (no validation)', () => {
        const args = u.preform(f.arguments);
        const actual = fn(
          args,
          Object.assign({ eccLib }, f.options, {
            validate: false,
          })
        );

        u.equate(actual, f.expected, f.arguments);
      });
    });

    fixtures.invalid.forEach((f: any) => {
      it('throws ' + f.exception + (f.description ? 'for ' + f.description : ''), () => {
        const args = u.preform(f.arguments);

        assert.throws(() => {
          fn(args, Object.assign({ eccLib }, f.options));
        }, new RegExp(f.exception));
      });
    });

    // cross-verify dynamically too
    if (!fixtures.dynamic) return;
    const { depends, details } = fixtures.dynamic;

    details.forEach((f: any) => {
      const detail = u.preform(f);
      const disabled: any = {};
      if (f.disabled) {
        f.disabled.forEach((k: string) => {
          disabled[k] = true;
        });
      }

      for (const key in depends) {
        if (key in disabled) continue;
        const dependencies = depends[key];

        dependencies.forEach((dependency: any) => {
          if (!Array.isArray(dependency)) dependency = [dependency];

          const args = {};
          dependency.forEach((d: any) => {
            u.from(d, detail, args);
          });
          const expected = u.from(key, detail);

          it(f.description + ', ' + key + ' derives from ' + JSON.stringify(dependency), () => {
            u.equate(fn(args), expected);
          });
        });
      }
    });
  });
});
